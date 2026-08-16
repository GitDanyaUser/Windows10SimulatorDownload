const OWNER = "GitDanyaUser";
const REPO = "Windows10SimulatorDownload";

const API =
    `https://api.github.com/repos/${OWNER}/${REPO}/releases`;


/* =========================
   ELEMENTS
   ========================= */

const x86Button =
    document.querySelector("#x86");

const x64Button =
    document.querySelector("#x64");

const x86Name =
    document.querySelector("#x86-name");

const x64Name =
    document.querySelector("#x64-name");

const releaseMeta =
    document.querySelector("#release-meta");

const changelog =
    document.querySelector("#changelog");

const archive =
    document.querySelector("#archive");

const errorBox =
    document.querySelector("#download-error");

const githubLink =
    document.querySelector("#github-link");


githubLink.href =
    `https://github.com/${OWNER}/${REPO}/releases`;


/* =========================
   DATE
   ========================= */

function formatDate(dateString) {

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(
        new Date(dateString)
    );
}


/* =========================
   BASIC MARKDOWN
   ========================= */

function renderMarkdown(text) {

    const escaped =
        (text || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");


    return escaped
        .replace(
            /^### (.+)$/gm,
            "<h3>$1</h3>"
        )

        .replace(
            /^## (.+)$/gm,
            "<h2>$1</h2>"
        )

        .replace(
            /^# (.+)$/gm,
            "<h1>$1</h1>"
        )

        .replace(
            /^\- (.+)$/gm,
            "<li>$1</li>"
        )

        .replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        )

        .replace(
            /\*(.+?)\*/g,
            "<em>$1</em>"
        )

        .replace(
            /\r?\n\r?\n/g,
            "<br><br>"
        );
}


/* =========================
   FIND INSTALLER
   ========================= */

function findAsset(
    release,
    pattern
) {

    return release.assets.find(
        asset =>
            pattern.test(asset.name)
    );
}


/* =========================
   SET DOWNLOAD BUTTON
   ========================= */

function setDownload(
    button,
    nameElement,
    asset
) {

    if (!asset) {
        return;
    }


    button.href =
        asset.browser_download_url;


    nameElement.textContent =
        asset.name;


    button.hidden = false;
}


/* =========================
   LOAD RELEASES
   ========================= */

async function loadReleases() {

    try {

        const response =
            await fetch(
                API,
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `GitHub API returned ${response.status}`
            );

        }


        const releases =
            await response.json();


        if (
            !Array.isArray(releases) ||
            releases.length === 0
        ) {

            throw new Error(
                "No releases found."
            );

        }


        /*
         * GitHub returns releases in
         * newest-first order.
         */

        const latest =
            releases[0];


        /* =========================
           LATEST RELEASE
           ========================= */

        releaseMeta.textContent =
            `Released ${
            formatDate(
                latest.published_at ||
                latest.created_at
            )
        }`;


        /* =========================
           INSTALLERS
           ========================= */

        const x86 =
            findAsset(
                latest,
                /x86/i
            );


        const x64 =
            findAsset(
                latest,
                /x64|amd64/i
            );


        setDownload(
            x86Button,
            x86Name,
            x86
        );


        setDownload(
            x64Button,
            x64Name,
            x64
        );


        /* =========================
           CHANGELOG
           ========================= */

        if (latest.body) {

            changelog.innerHTML =
                renderMarkdown(
                    latest.body
                );

        } else {

            changelog.innerHTML =
                "<p>No changelog was provided for this release.</p>";

        }


        /* =========================
           ARCHIVE
           ========================= */

        archive.innerHTML =
            releases
                .map(
                    release => `

                    <a
                        class="release"
                        href="${release.html_url}"
                        target="_blank"
                        rel="noopener"
                    >

                        <span>

                            <strong>
                                ${
                                    escapeHtml(
                                        release.name || "Release"
                                    )
                                }
                            </strong>

                            <small>
                                ${
                                    formatDate(
                                        release.published_at ||
                                        release.created_at
                                    )
                                }
                            </small>

                        </span>


                        <span class="release-arrow">
                            ›
                        </span>

                    </a>

                    `
                )
                .join("");


    } catch (error) {

        console.error(error);


        errorBox.hidden = false;


        releaseMeta.textContent =
            "Unable to load release information.";


        changelog.innerHTML =
            "<p>Release information is currently unavailable.</p>";


        archive.innerHTML =
            `
            <p style="padding: 24px">
                <a href="${githubLink.href}">
                    Open GitHub Releases
                </a>
            </p>
            `;
    }
}


/* =========================
   HTML ESCAPING
   ========================= */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================
   SCREENSHOT MODAL
   ========================= */

function initScreenshotModal() {

    const modal =
        document.getElementById("screenshot-modal");

    const modalImg =
        document.getElementById("modal-img");

    const modalClose =
        document.getElementById("modal-close");

    const backdrop =
        modal?.querySelector(".modal-backdrop");

    const screenshotCards =
        document.querySelectorAll(".screenshot-card");


    if (!modal || !modalImg) return;


    function openModal(imageSrc) {

        modalImg.src = imageSrc;

        modal.hidden = false;

        modal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
    }


    function closeModal() {

        modal.hidden = true;

        modal.setAttribute("aria-hidden", "true");

        modalImg.src = "";

        document.body.style.overflow = "";
    }


    screenshotCards.forEach(card => {

        card.addEventListener("click", () => {

            const fullSrc =
                card.getAttribute("data-full");

            if (fullSrc) openModal(fullSrc);

        });

    });


    modalClose?.addEventListener("click", closeModal);

    backdrop?.addEventListener("click", closeModal);


    document.addEventListener("keydown", e => {

        if (e.key === "Escape" && !modal.hidden) {
            closeModal();
        }

    });
}


/* =========================
   START
   ========================= */

loadReleases();

initScreenshotModal();