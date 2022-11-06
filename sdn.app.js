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

/* needed variables */
var song, by, currentLine, lastLine, lyrics;
var syncMode = false;
var libMode = false;
var songLoaded = false;
var track = document.getElementById("track");
localStorage.setItem("volume", 0.15);

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
async function modeSwitch(override) {
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

/* add the audio tag */
function createTrack(source) {
    player.innerHTML = "";
    track = document.createElement("audio");
    track.volume = localStorage.getItem("volume"); /* no earrapes */
    track.setAttribute("controls", "");
    track.setAttribute("id", "track");
    track.setAttribute("ontimeupdate", "updateTime()");
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

function clearLyrics(song, by, promo) {
    currentLine = lastLine = -1;
    lyrics = [];
    lyrics[0] = ["::[music-start]", -0.15];
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
        track.play()
    songLoaded = true;
}

function parseJson(json) {
    clearLyrics(json.song, json.by, json.promo)
    Object.values(json.lyrics).forEach((line, value) => lyrics[value + 1] = [line[0],
        line[1]
    ]);
    displayLyrics(true);
}

/* load the song files */
function loadSongOffURL(id) {
    const path = "songs/" + id + "/" + id;
    createTrack(path + ".mp3");
    fetch(path + ".json").then((response) => response.json()).then((response) => parseJson(response), function(reason) {
        writeLine("err", "error: malformed song JSON");
    });
}

/* play the music and sync lyrics */
function updateTime() {
    if (syncMode) return;
    let line = currentLine;
    while (line < lyrics.length - 1 && track.currentTime >= lyrics[line + 1][1]) {
        line++;
    }
    while (line <= lyrics.length - 1 && line > 0 && track.currentTime < lyrics[line][1]) {
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
function x(i) {
    line = i.getAttribute("id");
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

function e(i) {
    track.currentTime = lyrics[i.getAttribute("id")][1] + 0.15;
}

/* serialize the lyrics into json format */
function serializeLyrics() {
    let json = [];
    json.push('{', '"song":"', song, '","by":"', by, '","lyrics":', JSON.stringify(lyrics.slice(1)), '}');
    return json.join("");
}

/* saves lyrics to a text file*/
function serializeJSON() {
    download(song.replaceAll(" ", "_").toLowerCase() + "_" + by.replaceAll(" ", "_").toLowerCase() + ".json", serializeLyrics())
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

/* save URL to Local Storage using blob */
function blobify(url, mime, name) {
    var xhr = new XMLHttpRequest(),
        blob, fileReader = new FileReader();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";

    xhr.addEventListener("load", function() {
        if (xhr.status === 200) {
            blob = new Blob([xhr.response], { type: mime });
            fileReader.onload = function(evt) {
                var result = evt.target.result;
                loadSong();
                try {
                    localStorage.setItem(name, result);
                } catch (e) {
                    console.log("Storage failed: " + e);
                }
            };
            fileReader.readAsDataURL(blob);
        }
    }, false);
    xhr.send();
}

/* saves imported song to the library */
function saveSongToLS(file, id) {
    const data = URL.createObjectURL(file);
    // localStorage.setItem("")
    return data;
}

function importLyrics(song, by, ptext) {
    clearLyrics(song, by, null)
    let lines = ptext.trim().split("\n")
    let counter = 0;
    for (let x = 0; x < lines.length; x++) {
        let line = [lines[x].trim(), x * 5]
        if (line[0].length > 0) {
            counter++;
            lyrics[counter] = line;
        }
    }
}

/* this is hard. its not that hard. */
function importSong() {
    const musFile = document.getElementById("ifm-file").files[0];
    importLyrics(document.getElementById("ifm-song").value, document.getElementById("ifm-by").value, document.getElementById("ifm-lyrics").value);
    createTrack(saveSongToLS(musFile, null));
    displayLyrics(false);
    songLib();
    modeSwitch(true);
}

/* greet endpoint if the script has loaded correctly */
container.innerHTML += '<h2><em>application loaded successfully</em></h2>';
container.innerHTML += '<h1 class="hl">no song selected</h1>';
container.innerHTML += '<h1 class="hl">select a song from the library</h1>';

/* EOF */