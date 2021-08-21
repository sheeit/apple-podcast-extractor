"use strict";

var callbackfunc = (function () {

    var
        applePodcastsBaseURL = "https://podcasts.apple.com/podcast/id",
        hiddenTtiles,
        lastinput,
        navdiv,
        resultcounter = 0,
        resultsdiv;

    function getrss(formdata) {
        var
            action = formdata.get("action"),
            apiurl,
            podIdRegex = /(?:https?:\/\/podcasts.apple.com\/.*\/id)?(\d+)$/,
            script = document.getElementById("injected-script"),
            url = formdata.get("input");

        lastinput = action + " " + url;

        if (action === "lookup") {
            url = podIdRegex.exec(url);

            if (url === null) {
                alert("No Podcast ID found");
                return false;
            }

            url = url[1];

            apiurl = "https://itunes.apple.com/lookup"
                + "?id=" + encodeURIComponent(url)
                + "&entity=podcast"
                + "&callback=callbackfunc";

        } else if (action === "search") {
            apiurl = "https://itunes.apple.com/search"
                + "?term=" + encodeURIComponent(url).replaceAll("%20", "+")
                + "&country=US"

        } else {
            alert("Unknown action: " + action);
            return false;
        }

        apiurl += "&entity=podcast&callback=" + callbackfunc.name;

        // Remove the old script
        if (script)
            script.remove();

        script = document.createElement("script");
        script.src = apiurl;
        script.id = "injected-script";
        document.body.append(script);
        return true;
    }

    function enableButton(button) {
        button.removeAttribute("disabled");
    }

    function load(ignored) {
        hiddenTtiles = Array.from(document.getElementsByTagName("h2"));
        navdiv = document.getElementById("nav");
        resultsdiv = document.getElementById("results");

        document.forms[0].addEventListener("submit", function (e) {
            e.preventDefault();
            var formdata = new FormData(e.target);
            getrss(formdata);
        });

        enableButton(document.forms[0].elements["submit"]);
    }

    function getNavUl() {
        var navul = document.getElementById("navul");
        if (!navul) {
            navul = document.createElement("ol");
            navul.id = "navul";
            navdiv.appendChild(navul);
        }
        return navul;
    }

    function writeTextToClipboard(text) {
        if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText(text)
            .then(success)
            .catch(failure)
            return;
        } else {
            oldMethodCopy();
        }

        function oldMethodCopy() {
            var ret = document.queryCommandEnabled("copy");

            if (ret) {
                ret = document.execCommand("copy");
            }

            return ret;
        }

        function success() {}

        function failure(error) {
            console.error(error);
            oldMethodCopy();
        }
    }

    function selectOnClick(event) {
        writeTextToClipboard((function (target) {
            var sel = window.getSelection();
            sel.selectAllChildren(target);
            return sel.toString();
        })(event.target));

        event.stopPropagation();
        event.preventDefault();
    }

    function imageSrcToggler(one, two) {
        function clickHandler(event) {
            var src = event.target.src;
            event.target.src = src === one ? two : one;
        }
        return clickHandler;
    }

    function displayResult(result) {
        var
            fragment = document.createDocumentFragment(),
            li = document.createElement("li"),
            image = document.createElement("img"),
            nameh3 = document.createElement("h3"),
            artistp = document.createElement("p"),
            artista = document.createElement("a"),
            feedp = document.createElement("p"),
            feedspan = document.createElement("span"),
            podcastidp = document.createElement("p"),
            podcastida = document.createElement("a"),
            genres = document.createElement("ul"),
            clearFix = document.createElement("div");

        image.src = result.artworkUrl100;
        image.addEventListener("click",
            imageSrcToggler(result.artworkUrl100, result.artworkUrl600));

        nameh3.appendChild(document.createTextNode(result.trackName));
        nameh3.appendChild(document.createElement("br"));

        artistp.className = "podcast-artist";
        artista.appendChild(document.createTextNode(result.artistName));
        artista.href = result.artistViewUrl;
        artistp.appendChild(artista);

        feedspan.className = "podcast-feedurl";
        feedspan.appendChild(document.createTextNode(result.feedUrl));
        feedspan.addEventListener("click", selectOnClick);
        feedp.appendChild(document.createTextNode("Feed URL: "));
        feedp.appendChild(feedspan);

        podcastidp.className = "podcast-id";
        podcastidp.appendChild(document.createTextNode(
            "Podcast ID: "
        ));
        podcastida.appendChild(document.createTextNode(
            "id" + result.trackId
        ));
        podcastida.href = result.trackViewURL;
        podcastidp.appendChild(podcastida);

        genres.className = "genres";
        result.genres.forEach(function (genre) {
            var li = document.createElement("li");
            if (genre === result.primaryGenreName) {
                var b = document.createElement("b");
                b.textContent = genre;
                li.appendChild(b);
            } else {
                li.textContent = genre;
            }
            genres.appendChild(li);
        });

        clearFix.className = "clearfix";

        li.className = "podcast-li";
        li.appendChild(image);
        li.appendChild(nameh3);
        li.appendChild(artistp);
        li.appendChild(feedp)
        li.appendChild(podcastidp);
        li.appendChild(genres);
        li.appendChild(clearFix);

        fragment.appendChild(li);

        return fragment;
    }

    function callbackfunc(data) {
        var
            navul = getNavUl(),
            navli = document.createElement("li"),
            navp = document.createElement("p"),
            nava = document.createElement("a"),
            ul = document.createElement("ul"),
            uldiv = document.createElement("div"),

            gotonavp = document.createElement("p"),
            gotonava = document.createElement("a"),

            resultFragments = data.results.map(displayResult);
        
        hiddenTtiles.forEach(function (h2) {
            h2.className = "";
        });

        nava.href = "#result-" + resultcounter;
        nava.textContent = lastinput + " (" + data.resultCount + " results)";
        navp.appendChild(nava);
        navli.appendChild(navp);
        navul.appendChild(navli);

        uldiv.id = "result-" + resultcounter++;

        // If the results div only has one child element, then it's the <h2>
        // and it should be ignored.
        if (resultsdiv.childElementCount > 1) {
            resultsdiv.insertBefore(uldiv, resultsdiv.children[1]);
        } else {
            resultsdiv.appendChild(uldiv);
        }

        resultFragments.forEach(function (fragment) {
            ul.appendChild(fragment);
        });

        gotonava.href = "#top";
        gotonava.innerHTML = "&uarr; Go top &uarr;";
        gotonavp.appendChild(gotonava);
        uldiv.appendChild(ul);
        uldiv.appendChild(gotonavp);
        uldiv.appendChild(document.createElement("hr"));
    };


    window.addEventListener("load", load);


    return callbackfunc;
})();
