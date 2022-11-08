/* coded by hoshinetsu */

/* constant fields */
const container = document.querySelector(".lyrics");
const player = document.getElementById("player");
const xsg = document.getElementById("xsong");
const xby = document.getElementById("xby");
const lock = document.getElementById("xlock");
const msc = document.getElementById("mode_sc");
const mpb = document.getElementById("mode_pb");
const lib = document.getElementById("lib");
const edi = document.getElementById("edi");
const urlArgs = new URLSearchParams(window.location.search);
const sseeker = document.getElementById("seeker");
const svolume = document.getElementById("volume");
const playb = document.getElementById("play");
const ppos = document.getElementById("ppos");
const pdur = document.getElementById("pdur");
const loopb = document.getElementById("loop");

/* needed variables */
var song, by, currentLine, lastLine, lyrics;
var syncMode = false;
var libMode = false;
var songLoaded = false;
var track = document.getElementById("track");

if (!localStorage.getItem("volume")) {
    console.log("Setting defualt volume")
    localStorage.setItem("volume", 0.3); /* no earrapes */
} else {
    updateVolume(localStorage.getItem("volume"));
}

sseeker.setAttribute("max", 7680);
sseeker.addEventListener("input", function(event) {
    track.currentTime = event.target.value * track.duration / 7680;
});
svolume.setAttribute("max", 1000);
svolume.setAttribute("value", localStorage.getItem("volume") * 1000);
svolume.addEventListener("input", function(event) {
    updateVolume(event.target.value / 1000);
});

function updateVolume(vol) {
    localStorage.setItem("volume", vol);
    document.getElementById("l-volume").textContent = pad(Math.round(vol * 100), 3);
    if (track)
        track.volume = vol;
}

/* opens and closes the song library */
function songLib() {
    libMode = !libMode;
    if (libMode) {
        document.getElementById("overlay").removeAttribute("style");
    } else {
        document.getElementById("overlay").setAttribute("style", "display:none");
    }
}

/* play a song from library */
function playSongByName(trigger) {
    loadSongOffURL(trigger.getAttribute("data-songname"));
    songLib()
}

/* switch between playback and sync modes */
function modeSwitch(override) {
    if (!songLoaded) return;
    if (!override && lock.checked) {
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

function isLow(el) {
    return el.classList.contains("low");
}

function setHi(el) {
    el.classList.remove("low");
    el.classList.add("high");
}

function setLow(el) {
    el.classList.remove("high");
    el.classList.add("low");
}

/* add the audio tag */
function createTrack(source) {
    player.innerHTML = "";
    track = document.createElement("audio");
    track.volume = localStorage.getItem("volume");
    if (!isLow(loopb))
        track.setAttribute("loop", "")
    track.addEventListener('timeupdate', (event) => {
        updateTime();
    });
    track.addEventListener('play', function(event) {
        setHi(playb);
    });
    track.addEventListener('pause', function(event) {
        setLow(playb);
    });
    var b = document.createElement("source");
    b.setAttribute("src", source);
    b.setAttribute("type", "audio/mpeg");
    track.appendChild(b);
    player.appendChild(track);
}

/* create a lyric line in the container */
function writeLine(id, txt) {
    const line = document.createElement("h1");
    line.setAttribute("id", id);
    line.setAttribute("onclick", "x(this)")
    line.innerText = txt;
    container.appendChild(line);
}

/* removes the data of previously played song */
function clearLyrics(song, by, promo) {
    currentLine = lastLine = -1;
    lyrics = [];
    lyrics[0] = ["", 0];
    container.innerHTML = "";
    document.getElementById("song").classList.remove("yeet");
    document.getElementById("by").classList.remove("yeet");
    xsg.textContent = xby.textContent = "loading..";
    xsg.textContent = this.song = song;
    xby.textContent = this.by = by;
    if (promo) {
        xsg.setAttribute("href", promo);
        xby.setAttribute("href", promo);
    } else {
        xsg.removeAttribute("href");
        xby.removeAttribute("href");
    }
}

/* display the lyrics */
function displayLyrics(autoplay) {
    for (let x = 0; x < lyrics.length; x++) {
        writeLine(x, lyrics[x][0])
    }
    writeLine("nil", "endl");
    if (autoplay)
        togglePlay(true)
    songLoaded = true;
}

/* accepts lyrics in json format */
function parseJson(json) {
    clearLyrics(json.song, json.by, json.promo)
    Object.values(json.lyrics).forEach((line, value) => lyrics[value + 1] = [line[0],
        line[1]
    ]);
}

/* load the song files */
function loadSongOffURL(id) {
    const path = "songs/" + id + "/" + id;
    createTrack(path + ".mp3");
    fetch(path + ".json").then((response) => response.json()).then(function(response) {
        parseJson(response);
        displayLyrics(true);
    }, function(reason) {
        writeLine("err", "error: malformed song JSON");
    });
}

function pad(n, width) {
    n = Math.round(n) + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function updateDuration(x, y) {

}

/* play the music and sync lyrics */
function updateTime() {
    sseeker.value = track.currentTime * 7680 / track.duration;
    ppos.textContent = pad(track.currentTime / 60, 2) + ":" + pad(track.currentTime % 60, 2);
    pdur.textContent = pad(track.duration / 60, 2) + ":" + pad(track.duration % 60, 2);
    if (syncMode) return;
    let line = currentLine;
    while (line >= 0 && track.currentTime < lyrics[line][1]) {
        line--;
        console.log("-")
    }

    while (line < lyrics.length - 1 && track.currentTime >= lyrics[line + 1][1]) {
        line++;
        console.log("+")
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
    for (let x = 0; x < lyrics.length; x++) {
        lyrics[x][1] = 0;
        reloadLyrics(x);
    }
}

/* used when switching modes */
function reloadLyrics(x) {
    if (syncMode)
        document.getElementById(x).innerHTML = "<h2>" + lyrics[x][0] + '<span>' + lyrics[x][1].toFixed(5) + "</span></h2>";
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
    if (line >= 0 && line < lyrics.length)
        document.getElementById(line).scrollIntoView({ block: "center" });
}

/* highlight active lines */
function updateLyricsDisplay() {
    let element;
    for (let x = lyrics.length - 1; x >= currentLine; x--) {
        if (x < 0) continue;
        element = document.getElementById(x);
        element.removeAttribute("class");
        if (x == currentLine) {
            element.classList.add("ongoing");
        }
        if (syncMode) {
            reloadLyrics(x);
        }
    }
    for (let x = 0; x <= currentLine; x++) {
        element = document.getElementById(x);
        if (x == currentLine) {
            element.classList.add("ongoing");
        } else {
            element.classList.remove("ongoing");
            element.classList.add("active");
        }
        if (syncMode) {
            reloadLyrics(x);
        }
    }
    scrollToLine(currentLine)
}

/* invoked when a line is clicked */
function x(i) {
    line = i.getAttribute("id");
    if (syncMode) {
        syncLine(line);
    } else {
        togglePlay(true);
        track.currentTime = lyrics[line][1] + 0.15;
    }
}

/* rewind to a line */
function e(i) {
    track.currentTime = lyrics[i.getAttribute("id")][1];
}

/* serialize the lyrics into json format */
function serializeLyrics() {
    let json = [];
    json.push('{', '"song":"', song, '","by":"', by, '","lyrics":', JSON.stringify(lyrics.slice(1)), '}');
    return new Blob(json, { type: "application/json" })
}

/* saves lyrics to a text file*/
function serializeJSON() {
    download(song.replaceAll(" ", "_").toLowerCase() + "_" + by.replaceAll(" ", "_").toLowerCase() + ".json", serializeLyrics())
}

/* download a blob */
function download(file, blob) {
    var element = document.createElement('a');
    element.setAttribute('href', URL.createObjectURL(blob));
    element.setAttribute('download', file);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/* saves imported song to the library */
function saveSongToLS(mp3, json) {;
}

/* converts lyrics to JSON format for synchronization */
function importLyrics(song, by, ptext) {
    clearLyrics(song, by, null)
    let lines = ptext.trim().split("\n")
    let counter = 0;
    for (let x = 0; x < lines.length; x++) {
        let line = [lines[x].trim(), Math.round(x * 100 / lines.length)]
        if (line[0].length > 0) {
            counter++;
            lyrics[counter] = line;
        }
    }
}

/* this was hard. before i met blob. */
function importSong() {
    const theFile = document.getElementById("ifm-file").files[0];
    if (!theFile.type.startsWith("audio/")) {
        alert("Error: " + theFile.name + " is not an audio file.");
        return;
    }
    importLyrics(document.getElementById("ifm-song").value, document.getElementById("ifm-by").value, document.getElementById("ifm-lyrics").value);
    createTrack(URL.createObjectURL(theFile));
    displayLyrics(false);
    songLib();
    modeSwitch(true);
    playb.removeAttribute("disabled");
}

/* open the sdn file */
function openSdn() {
    const mp3 = document.getElementById("o-sdn").files[0];
    const json = document.getElementById("o-json").files[0];
    if (!mp3.type.startsWith("audio/")) {
        alert("Error: " + mp3.name + " is not an audio file.");
        return;
    } else if (!json.type.startsWith("application/json")) {
        alert("Error: " + json.name + " is not a JSON file.");
        return;
    }
    let read = new FileReader();
    read.onload = function(event) {
        parseJson(JSON.parse(event.target.result));
        createTrack(URL.createObjectURL(mp3));
        displayLyrics(true);
        songLib();
    }
    read.readAsText(json);
}

/* experimental toggle function */
function togglePlay(force) {
    playb.removeAttribute("disabled")
    if (isLow(playb) || force) {
        track.play()
    } else {
        track.pause()
    }
}

function toggleLoop() {
    console.log(loop)
    if (isLow(loopb)) {
        setHi(loopb)
        track.setAttribute("loop", "")
    } else {
        setLow(loopb)
        track.removeAttribute("loop")
    }
}

/* autoplay the song from url params */
if (urlArgs.get("ap")) {
    loadSongOffURL(urlArgs.get("name"));
} else {
    /* or inform the endpoint that the script has loaded correctly */
    container.innerHTML += '<h2><em>application loaded successfully</em></h2>';
    container.innerHTML += '<h1 class="hl">no song selected</h1>';
    container.innerHTML += '<h1 class="hl">select a song from the library</h1>';

}

/* EOF */