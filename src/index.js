('use strict');
(function () {
  /*--------------------------------------------------------------
  /* Generic Variables
  --------------------------------------------------------------*/

  // ----- DOM Elements -----
  const preloader = document.querySelector('.preloader');
  const pageContainer = document.querySelector('.container');

  const hamburgerButton = document.querySelector('.header-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  const allHeaderForms = document.querySelectorAll('.header-form');
  const desktopHeaderForm = document.querySelector('.header-form--desktop');

  const repoNavUserElement = document.querySelector('.main-nav-user');

  const usernameElements = Array.prototype.slice.call(
    document.querySelectorAll('.username-text')
  );
  const avatarImageElements = Array.prototype.slice.call(
    document.querySelectorAll('.avatar__image')
  );

  const statusEmojiContainers = Array.prototype.slice.call(
    document.querySelectorAll('.avatar-status-image-container')
  );
  const statusTextItems = Array.prototype.slice.call(
    document.querySelectorAll('.avatar-status__text')
  );

  const userFullName = document.querySelector('.account-heading__fullname');
  const userBio = document.querySelector('.account-bio');

  const allRepositoriesCount = document.querySelector('.main-nav-link__count');
  const publicRepositoriesCount = document.querySelector(
    '.repo-search__number'
  );

  const reposContainer = document.querySelector('.repos');

  // ----- Data Query Information -----
  const baseUrl = 'https://api.github.com/graphql';

  const headers = {
    'Content-Type': 'application/json',
    authorization: 'bearer ' + process.env.GITHUB_TOKEN,
  };

  const query = `query {
                  viewer {
                    avatarUrl
                    status {
                      message
                      emojiHTML
                    }
                    name
                    login
                    bio
                    repositories(first: 20, orderBy: {field:UPDATED_AT, direction:DESC}) {
                      totalCount
                      nodes {
                        name
                        isPrivate
                        isFork
                        parent {
                          nameWithOwner
                        }
                        description
                        primaryLanguage {
                          color
                          name
                        }
                        stargazers {
                          totalCount
                        }
                        forks {
                          totalCount
                        }
                        licenseInfo {
                          name
                        }
                        updatedAt
                      }
                    }
                  }
                }`;

  /*--------------------------------------------------------------
  /* Methods
  --------------------------------------------------------------*/

  // ----- Generic Methods -----
  /**
   * Remove all HTML encoded in a third-party string
   * https://portswigger.net/web-security/cross-site-scripting/preventing
   * @param  {String} The third-party string
   * @return {String} The sanitized string
   */
  const removeHTMLFromString = function (str) {
    return str.replace(/[^\w. ]/gi, function (c) {
      return '&#' + c.charCodeAt(0) + ';';
    });
  };

  /**
   * Format API-obtained 'repo last updated' date into UI-required format
   * @param  {String} The API-obtained raw date data
   * @return {String} The formatted date
   */
  const formatUpdatedDate = function (updatedDateData) {
    const todaysDate = new Date();
    const updatedDate = new Date(updatedDateData);

    const updatedMonth = new Intl.DateTimeFormat('en-US', {
      month: 'short',
    }).format(updatedDate);
    const updatedDay = updatedDateData.slice(8, 10);

    // Render year only if repository is from a previous year
    var updatedDateString = 'on ' + updatedMonth + ' ' + updatedDay;
    if (updatedDate.getFullYear() !== todaysDate.getFullYear()) {
      updatedDateString =
        'on ' +
        updatedMonth +
        ' ' +
        updatedDay +
        ', ' +
        updatedDate.getFullYear();
    }

    const daysAgo = Math.round(
      Math.abs((todaysDate - updatedDate) / (60 * 60 * 24 * 1000))
    );
    const hoursAgo = Math.round(
      Math.abs((todaysDate - updatedDate) / (60 * 60 * 1000))
    );

    const timeAgoString =
      hoursAgo < 24
        ? hoursAgo.toString() + ' hours ago'
        : daysAgo < 2
        ? 'yesterday'
        : daysAgo.toString() + ' days ago';

    /* 
    /* Return a formatted date string if a repository 
    /* has been updated more than 30 days ago 
    */
    return daysAgo > 30 ? updatedDateString : timeAgoString;
  };

  // ----- Data Fetching -----
  /**
   * Asynchronously query the Github API
   * @return {Object} JSON data for my Github
   */
  const fetchData = function () {
    return fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: query,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log(data);
        return data.data.viewer;
      });
  };

  // ----- DOM Manipulation -----
  const hidePreloaderShowPage = function () {
    preloader.classList.add('h-hide');
    pageContainer.classList.remove('h-hide');
  };

  const toggleMobileMenu = function () {
    mobileMenu.classList.toggle('h-hide');
  };

  const toggleHeaderInputExpansion = function (event) {
    const eventTargetParent = event.target.parentNode;

    if (!event.target.closest('.header-form')) {
      allHeaderForms.forEach(function (form) {
        form.classList.remove('h-clicked-form');
      });
      desktopHeaderForm.classList.remove('h-clicked-form-desktop');

      return;
    }

    if (eventTargetParent.classList.contains('header-form')) {
      eventTargetParent.classList.add('h-clicked-form');
    }
    if (eventTargetParent.classList.contains('header-form--desktop')) {
      desktopHeaderForm.classList.add('h-clicked-form-desktop');
    }
  };

  const toggleUserAvatar = function () {
    if (window.pageYOffset >= 360) {
      repoNavUserElement.style.opacity = 1;
    } else {
      repoNavUserElement.style.opacity = 0;
    }
  };

  // ----- Data Updates -----
  const updateUsernames = function (data) {
    const username = data.login;

    usernameElements.forEach(function (usernameElement) {
      return (usernameElement.textContent = username);
    });
  };

  const updateAvatarImages = function (data) {
    const avatarUrl = data.avatarUrl;

    avatarImageElements.forEach(function (avatarImageElement) {
      return (avatarImageElement.src = avatarUrl);
    });
  };

  const updateAvatarStatus = function (data) {
    // Render basic smiley if no status has been set
    const statusEmoji = data.status
      ? data.status.emojiHTML
      : `<svg
          class="avatar-status-image"
          viewBox="0 0 16 16"
          version="1.1"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zM5 
            8a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zM5.32 9.636a.75.75 0 
            011.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 
            1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 
            111.222.87l-.614-.431c.614.43.614.431.613.431v.001l-.001.002-.002.003-.005.007-.014.019a1.984 
            1.984 0 01-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.32 
            3.32 0 01-.715-.657l-.014-.02-.005-.006-.002-.003v-.002h-.001l.613-.432-.614.43a.75.75 0 01.183-1.044h.001z"
          ></path>
        </svg>`;

    const statusText = data.status ? data.status.message : 'Set Status';

    statusEmojiContainers.forEach(function (statusEmojiContainer) {
      return (statusEmojiContainer.innerHTML = statusEmoji);
    });
    statusTextItems.forEach(function (statusTextItem) {
      return (statusTextItem.textContent = statusText);
    });
  };

  const updateFullName = function (data) {
    userFullName.textContent = data.name;
  };

  const updateBio = function (data) {
    userBio.textContent = data.bio;
  };

  const countPublicRepos = function (data) {
    return data.repositories.nodes.filter(function (eachRepo) {
      return !eachRepo.isPrivate;
    }).length;
  };

  // ----- Component Templates. (Optional Data Rendered Conditionally) -----
  const getRepoParentTemplate = function (repository) {
    return repository.isFork
      ? `
        <span class="repo-details__parent">
          Forked from <a href="#">${removeHTMLFromString(
            repository.parent.nameWithOwner
          )}</a>
        </span>
        `
      : '';
  };

  const getRepoDescriptionTemplate = function (repository) {
    return repository.description
      ? `
        <p class="repo-details__description">
          ${removeHTMLFromString(repository.description) || ''}
        </p>
        `
      : '';
  };

  const getRepoPrimaryLanguageTemplate = function (repository) {
    const primaryLanguageName = repository.primaryLanguage
      ? removeHTMLFromString(repository.primaryLanguage.name)
      : '';

    return repository.primaryLanguage
      ? `
        <p class="repo-language h-mr-16 h-flex">
          <span class="repo-language__colour" style="background-color:${removeHTMLFromString(
            repository.primaryLanguage.color
          )}"></span>
          <span class="repo-language__name">${primaryLanguageName}</span>
        </p>
        `
      : '';
  };

  const getRepoStarsTemplate = function (repository) {
    return repository.stargazers.totalCount
      ? `
        <a class="repo-stars h-mr-16 h-flex" href="#">
          <svg
            aria-hidden="true"
            aria-label="star"
            class="repo-stars__icon"
            viewBox="0 0 16 16"
            version="1.1"
            width="16"
            height="16"
            role="img"
          >
            <path
              fill-rule="evenodd"
              d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 
              1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 
              1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 
              01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 
              5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 
              3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 
              01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
            ></path>
          </svg>

          <span class="h-screen-reader-text">View Stars. Number of stars:</span>
          <span class="repo-stars__count">${repository.stargazers.totalCount}</span>
        </a>
        `
      : '';
  };

  const getRepoForksTemplate = function (repository) {
    return repository.forks.totalCount
      ? `
        <a class="repo-forks h-mr-16 h-flex" href="#">
          <svg
            aria-hidden="true"
            class="repo-forks__icon"
            viewBox="0 0 16 16"
            version="1.1"
            width="16"
            height="16"
            role="img"
          >
            <path
              fill-rule="evenodd"
              d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 
              10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 
              0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 
              0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 
              .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
            ></path>
          </svg>

          <span class="h-screen-reader-text">View forks. Number of forks:</span>
          <span class="repo-stars__count">${repository.forks.totalCount}</span>
        </a>
        `
      : '';
  };

  const getRepoLicenseTemplate = function (repository) {
    return repository.licenseInfo
      ? `
        <span class="repo-license h-mr-16 h-flex" href="#">
          <svg
            class="repo-license__icon"
            viewBox="0 0 16 16"
            version="1.1"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8.75.75a.75.75 0 00-1.5 0V2h-.984c-.305 0-.604.08-.869.23l-1.288.737A.25.25 
              0 013.984 3H1.75a.75.75 0 000 1.5h.428L.066 9.192a.75.75 0 
              00.154.838l.53-.53-.53.53v.001l.002.002.002.002.006.006.016.015.045.04a3.514 3.514 
              0 00.686.45A4.492 4.492 0 003 11c.88 0 1.556-.22 2.023-.454a3.515 3.515 0 
              00.686-.45l.045-.04.016-.015.006-.006.002-.002.001-.002L5.25 9.5l.53.53a.75.75 0 
              00.154-.838L3.822 4.5h.162c.305 0 .604-.08.869-.23l1.289-.737a.25.25 0 01.124-.033h.984V13h-2.5a.75.75 
              0 000 1.5h6.5a.75.75 0 000-1.5h-2.5V3.5h.984a.25.25 0 01.124.033l1.29.736c.264.152.563.231.868.231h.162l-2.112 
              4.692a.75.75 0 00.154.838l.53-.53-.53.53v.001l.002.002.002.002.006.006.016.015.045.04a3.517 
              3.517 0 00.686.45A4.492 4.492 0 0013 11c.88 0 1.556-.22 2.023-.454a3.512 3.512 0 
              00.686-.45l.045-.04.01-.01.006-.005.006-.006.002-.002.001-.002-.529-.531.53.53a.75.75 
              0 00.154-.838L13.823 4.5h.427a.75.75 0 000-1.5h-2.234a.25.25 0 01-.124-.033l-1.29-.736A1.75 
              1.75 0 009.735 2H8.75V.75zM1.695 9.227c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327l-1.305 
              2.9zm10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327l-1.305 2.9z"
            ></path>
          </svg>

          <span class="repo-stars__count">${removeHTMLFromString(
            repository.licenseInfo.name
          )}</span>
        </span>
        `
      : '';
  };

  // ----- Component Rendering -----
  const renderAccountInfoComponents = function (completeData) {
    allRepositoriesCount.textContent = completeData.repositories.totalCount;
    publicRepositoriesCount.textContent = countPublicRepos(completeData);

    updateUsernames(completeData);
    updateAvatarStatus(completeData);
    updateAvatarImages(completeData);

    // Conditionally Render Optional Components
    completeData.name && updateFullName(completeData);
    completeData.bio && updateBio(completeData);
  };

  const renderRepositories = function (data) {
    reposContainer.innerHTML = data.repositories.nodes
      .map(function (eachRepo) {
        const repoParentTemplate = getRepoParentTemplate(eachRepo);
        const repoDescriptionTemplate = getRepoDescriptionTemplate(eachRepo);
        const repoPrimaryLanguageTemplate = getRepoPrimaryLanguageTemplate(
          eachRepo
        );
        const repoStarsTemplate = getRepoStarsTemplate(eachRepo);
        const repoForksTemplate = getRepoForksTemplate(eachRepo);
        const repoLicenseTemplate = getRepoLicenseTemplate(eachRepo);
        const repoUpdatedDate = formatUpdatedDate(eachRepo.updatedAt);

        // Return Full Repository Templates with Private Repositories Filtered Out
        return !eachRepo.isPrivate
          ? `<article class="single-repo h-flex">
                <div class="single-repo__left">
                  <h3 class="single-repo__name">
                    <a class="single-repo__link" href="#">
                      ${removeHTMLFromString(eachRepo.name)}
                      <span class="h-screen-reader-text"> repository</span>
                    </a>
                  </h3>

                  <div class="repo-details">
                    ${repoParentTemplate}

                    ${repoDescriptionTemplate}

                    <div class="repo-details__indicators h-flex">
                      ${repoPrimaryLanguageTemplate}

                      ${repoStarsTemplate}
                     
                      ${repoForksTemplate}
                      
                      ${repoLicenseTemplate}
                     
                      <p class="repo-update">
                        Updated <span class="repo-update-date">${repoUpdatedDate}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="single-repo__right h-flex">
                  <button class="star-button h-flex" aria-label="Star this repository">
                    <svg
                      class="star-button__icon"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 
                        1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 
                        1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 
                        01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 
                        0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 
                        0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 
                        0 01-.564-.41L8 2.694v.001z"
                      ></path>
                    </svg>

                    <span class="star-button__text">Star</span>
                  </button>
                </div>
              </article>`
          : '';
      })
      .join('');
  };

  /*--------------------------------------------------------------
  /* Event Delegation & Listeners
  --------------------------------------------------------------*/

  // Hamburger Toggle
  hamburgerButton.addEventListener('click', toggleMobileMenu, false);

  // Event Delegation for Header Input Expansion
  document.addEventListener('click', toggleHeaderInputExpansion, false);

  // Show and Hide User Profile in Repo Section Header
  window.addEventListener('scroll', toggleUserAvatar, false);

  /*--------------------------------------------------------------
  /* Render Components Asynchronously
  --------------------------------------------------------------*/

  fetchData().then(function (data) {
    hidePreloaderShowPage();
    renderAccountInfoComponents(data);
    renderRepositories(data);
  });
})();
