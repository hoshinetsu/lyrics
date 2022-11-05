const container = document.querySelector(".lyrics");
const player = document.getElementById("player");
// const urlParams = new URLSearchParams(window.location.search); ne

/* add the audio tag */
function createTrack(source) {
    player.innerHTML = "";
    var a = document.createElement("audio");
    a.volume = 0.15; /* no earrapes */
    a.setAttribute("controls", "");
    a.setAttribute("id", "track");
    a.setAttribute("ontimeupdate", "updateTime()");
    var b = document.createElement("source");
    b.setAttribute("src", source);
    b.setAttribute("type", "audio/mpeg");
    a.appendChild(b);
    player.appendChild(a);
    return a;
}

var song, by;
var lyrics = [];
var currentLine = -1;
var lastLine = -1;
var syncMode = false;
var libMode = false;
var songLoaded = false;
var track = document.getElementById("track");


/* opens and closes the song library */
function songLib() {
    libMode = !libMode;
    if (libMode) {
        document.getElementById("overlay").classList.remove("mode-off");
    } else {
        document.getElementById("overlay").classList.add("mode-off");
    }
}

/* play a song from library */
function playSong(trigger) {
    const name = trigger.getAttribute("data-songname");
    loadSong(name + ".mp3", name + ".json");
    songLib()
    track.play()
}



/* switch between playback and sync modes */
async function modeSwitch() {
    if (!songLoaded) return;
    const lock = document.getElementById("xlock");
    const msc = document.getElementById("mode_sc");
    const mpb = document.getElementById("mode_pb");
    const lib = document.getElementById("lib");
    const edi = document.getElementById("edi");


    if (lock.checked) {
        alert("Mode is locked to prevent accidental switching.\r\nRemove mode lock and switch again.");
    } else {
        syncMode = !syncMode;
        if (syncMode) {
            mpb.classList.add("mode-off"); // mode playback
            lib.classList.add("mode-off"); // library tool
            edi.classList.remove("mode-off"); // editor tool
            msc.classList.remove("mode-off"); // mode sync

        } else {
            edi.classList.add("mode-off"); // editor tool
            msc.classList.add("mode-off"); // mode sync
            mpb.classList.remove("mode-off"); // mode playback
            lib.classList.remove("mode-off"); // library tool
        }
        lock.checked = true;
        track.pause();
        track.currentTime = 0
        setLine(0)
        for (let x = 0; x < lyrics.length; x++)
            reloadLyrics(x)
    }
}

/* load the song files */
function loadSong(aud, lyr) {
    const src = document.createElement("source");
    const xsg = document.getElementById("xsong");
    const xby = document.getElementById("xby");

    xsg.textContent = xby.textContent = "loading..";
    container.innerHTML = "";
    player.innerHTML = "";
    track = createTrack("songs/" + aud);

    fetch("lyrics/" + lyr).then((response) => response.json()).then(function(json) {
        xsg.textContent = song = json.song;
        xby.textContent = by = json.by;
        lyrics[0] = ["::[music-start]", -0.15];
        Object.values(json.lyrics).forEach((line, value) => lyrics[value + 1] = [line[0],
            line[1]
        ]);
        loadLyrics();
        songLoaded = true;
    }, function(reason) {
        writeLine("err", "error: malformed song JSON");
    });
}

/* create a lyric line in the container */
function writeLine(id, txt) {
    const line = document.createElement("h1");
    line.setAttribute("id", id);
    line.setAttribute("onclick", "jumpTo(this.id)")
    line.innerText = txt;
    container.appendChild(line);
}

// /* invoke loads an example song */
// loadSong("ur_my_drug_i_luv_u.mp3", "drugs.json");
// loadSong(urlParams.get('song') + ".mp3", urlParams.get('song') + ".json")

/* display the lyrics */
function loadLyrics() {
    for (let x = 0; x < lyrics.length; x++) {
        writeLine(x, lyrics[x][0])
    }
}

/* play the music and sync lyrics */
function updateTime() {
    if (syncMode) return;
    let line = currentLine;
    while (line < lyrics.length - 1 && track.currentTime >= lyrics[line + 1][1]) {
        line++;
    }
    while (line > 0 && track.currentTime < lyrics[line][1]) {
        line--;
    }
    setLine(line)
}

/* time the line to music */
function syncLine(line) {
    if (syncMode && line < lyrics.length) {
        let time = track.currentTime - 0.3;
        lastTime = time;
        lyrics[line][1] = time;
        reloadLyrics(line)
        setLine(Math.min(line, lyrics.length - 1))
    }
}

/* remove all timings! */
function resetTimings() {
    if (!confirm("You sure? Any unsaved timings will be lost!")) return;
    track.pause();
    track.currentTime = 0;
    setLine(0);
    for (let x = 1; x < lyrics.length; x++) {
        lyrics[x][1] = 0;
        reloadLyrics(x);
    }
}

/* used when switching modes */
function reloadLyrics(x) {
    if (syncMode)
        document.getElementById(x).innerHTML = "<h2>" + lyrics[x][0] + "<small>" + lyrics[x][1] + "</small></h2>";
    else
        document.getElementById(x).textContent = lyrics[x][0];
}

/* set current line to @param line*/
function setLine(line) {
    if (currentLine != line) {
        lastLine = currentLine;
        currentLine = line;
        updateLyricsDisplay()
    }
}

/* scroll a line into viewport */
function scrollToLine(line) {
    document.getElementById(Math.max(0, line - 1)).scrollIntoView();
}

/* highlight active lines */
function updateLyricsDisplay() {
    for (let x = lyrics.length - 1; x >= currentLine; x--) {
        document.getElementById(x).removeAttribute("class");
        if (syncMode) {
            reloadLyrics(x);
        }
    }
    for (let x = 0; x <= currentLine; x++) {
        document.getElementById(x).setAttribute("class", "active");
        if (syncMode) {
            reloadLyrics(x);
        }
    }
    scrollToLine(currentLine)
}

/* invoked when a line is clicked */
function jumpTo(line) {
    if (syncMode) {
        if (line == 0) {
            track.currentTime = 0;
            track.play();
        } else
            syncLine(line);
    } else {
        track.play();
        track.currentTime = lyrics[line][1] + 0.15;
    }
}

/* serialize the lyrics into json format */
function serializeJson() {
    let json = [];
    json.push('{', '"song":"', song, '","by":"', by, '","lyrics":', JSON.stringify(lyrics.slice(1)), '}');
    return json.join("");
}

/* saves lyrics to a text file*/
function dlLyrics() {
    download("Syncd lyrics for " + song + ".json", serializeJson())
}

/* download string as text file */
function download(file, content) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', file);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

container.innerHTML += '<h1><em>App loaded successfully.</em></h1>';
container.innerHTML += '<h1 class="hl">No song selected</h1>';
container.innerHTML += '<h1 class="hl">Select a song from the library.</h1>';