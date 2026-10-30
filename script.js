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


const ARCHIVE_PREVIEW = 5;

let allReleases = [];


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
            /(<li>.*<\/li>\n?)+/g,
            match => `<ul>${match.replace(/\n/g, "")}</ul>`
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

        allReleases = releases;

        renderArchive();


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
   RELEASE HELPERS
   ========================= */

function releaseTitle(release) {

    return release.name || release.tag_name || "Release";
}


function releaseDate(release) {

    return formatDate(
        release.published_at ||
        release.created_at
    );
}


function formatSize(bytes) {

    if (!bytes) return "";

    const mb = bytes / (1024 * 1024);

    return mb >= 1
        ? `${mb.toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}


/* =========================
   ARCHIVE LIST
   ========================= */

function renderArchive() {

    const shown =
        allReleases.slice(0, ARCHIVE_PREVIEW);


    let html =
        shown
            .map(
                (release, index) => `

                <button
                    type="button"
                    class="release"
                    data-index="${index}"
                >
                    <span>
                        <strong>${escapeHtml(releaseTitle(release))}</strong>
                        <small>${releaseDate(release)}</small>
                    </span>

                    <span class="release-arrow">›</span>
                </button>

                `
            )
            .join("");


    if (allReleases.length > ARCHIVE_PREVIEW) {

        html += `

            <button
                type="button"
                class="release release-all"
                data-all
            >
                <span>
                    <strong>List all releases (${allReleases.length})</strong>
                </span>

                <span class="release-arrow" aria-hidden="true">&#xE712;</span>
            </button>

        `;
    }


    archive.innerHTML = html;
}


/* =========================
   ALL RELEASES POPUP
   ========================= */

function initReleasesModal() {

    const modal =
        document.getElementById("releases-modal");

    const list =
        document.getElementById("releases-list");

    const detail =
        document.getElementById("release-detail");

    const closeButton =
        document.getElementById("releases-close");

    const backdrop =
        modal?.querySelector(".modal-backdrop");


    if (!modal || !list || !detail) return;


    let lastFocused = null;


    function renderList() {

        list.innerHTML =
            allReleases
                .map(
                    (release, index) => `

                    <button
                        type="button"
                        class="rl-item"
                        data-index="${index}"
                    >
                        <strong>
                            ${escapeHtml(releaseTitle(release))}
                            ${index === 0
                                ? '<span class="rl-badge">Latest</span>'
                                : ""}
                            ${release.prerelease
                                ? '<span class="rl-badge rl-badge-pre">Pre-release</span>'
                                : ""}
                        </strong>
                        <small>${releaseDate(release)}</small>
                    </button>

                    `
                )
                .join("");
    }


    function selectRelease(index) {

        const release = allReleases[index];

        if (!release) return;


        list
            .querySelectorAll(".rl-item")
            .forEach(item => {

                item.setAttribute(
                    "aria-current",
                    String(Number(item.dataset.index) === index)
                );

            });


        const assets =
            (release.assets || [])
                .map(
                    asset => `

                    <a
                        class="rd-asset"
                        href="${escapeHtml(asset.browser_download_url)}"
                    >
                        <span class="rd-asset-icon" aria-hidden="true">&#xE896;</span>
                        <span class="rd-asset-name">${escapeHtml(asset.name)}</span>
                        <small>${formatSize(asset.size)}</small>
                    </a>

                    `
                )
                .join("");


        const notes =
            release.body
                ? renderMarkdown(release.body)
                : "<p>No changelog was provided for this release.</p>";


        detail.innerHTML = `

            <h3>${escapeHtml(releaseTitle(release))}</h3>

            <p class="rd-meta">
                Released ${releaseDate(release)}
            </p>

            <h4>Downloads</h4>

            <div class="rd-assets">
                ${assets || "<p>No downloads are attached to this release.</p>"}
            </div>

            <h4>Changelog</h4>

            <div class="changelog rd-changelog">${notes}</div>

            <a
                class="rd-github"
                href="${escapeHtml(release.html_url)}"
                target="_blank"
                rel="noopener"
            >
                View on GitHub ↗
            </a>

        `;


        detail.scrollTop = 0;
    }


    function openModal(index = 0) {

        if (allReleases.length === 0) return;


        lastFocused = document.activeElement;

        renderList();

        selectRelease(index);


        modal.hidden = false;

        modal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";


        list
            .querySelector(`[data-index="${index}"]`)
            ?.scrollIntoView({ block: "nearest" });


        closeButton.focus();
    }


    function closeModal() {

        modal.hidden = true;

        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        lastFocused?.focus?.();
    }


    /* Archive on the page */

    archive.addEventListener("click", event => {

        const target =
            event.target.closest("[data-index], [data-all]");

        if (!target) return;


        openModal(
            target.hasAttribute("data-all")
                ? 0
                : Number(target.dataset.index)
        );
    });


    /* Choose a release inside the popup */

    list.addEventListener("click", event => {

        const item =
            event.target.closest(".rl-item");

        if (item) {
            selectRelease(Number(item.dataset.index));
        }
    });


    closeButton.addEventListener("click", closeModal);

    backdrop?.addEventListener("click", closeModal);


    document.addEventListener("keydown", event => {

        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}


/* =========================
   START
   ========================= */

loadReleases();

initScreenshotModal();

initReleasesModal();