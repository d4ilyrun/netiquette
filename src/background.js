import { News } from "./netiquette/checker.js"

async function checkComposeNetiquette() {
    let tabs = await messenger.tabs.query({
        active: true,
        currentWindow: true
    });

    let details = await messenger.compose.getComposeDetails(tabs[0].id);
    let news = new News(details);

    let fails = news.checkNetiquette();

    let reportGrid = document.getElementById("report-grid");
    console.log(fails);

    for (const fail of fails) {
        let error = document.createElement("div");
        error.classList.add("netiquette-error");
        error.innerText = fail.getOutput();

        reportGrid.appendChild(error);
    }
}

checkComposeNetiquette();
