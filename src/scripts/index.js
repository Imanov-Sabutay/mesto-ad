/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addCard,
  deleteCard as deleteCardFromServer,
  changeLikeCardStatus,
} from "./components/api.js";
import {
  createCardElement,
  updateCardLikeState,
  deleteCardElement,
} from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

const validationSettings = {
  formSelector: ".popup__form:not([name='remove-card'])",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description"
);
const profileSubmitButton = profileForm.querySelector(".popup__button");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const cardSubmitButton = cardForm.querySelector(".popup__button");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const avatarSubmitButton = avatarForm.querySelector(".popup__button");

const deleteCardModalWindow = document.querySelector(".popup_type_remove-card");
const deleteCardForm = deleteCardModalWindow.querySelector(".popup__form");
const deleteCardSubmitButton = deleteCardForm.querySelector(".popup__button");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalUserList = cardInfoModalWindow.querySelector(".popup__list");

let currentUserId = "";
let cardIdToDelete = null;
let cardElementToDelete = null;

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const setButtonLoadingState = (button, isLoading, loadingText, defaultText) => {
  button.textContent = isLoading ? loadingText : defaultText;
  button.disabled = isLoading;
};

const createInfoString = (term, description) => {
  const infoElement = document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);

  infoElement.querySelector(".popup__info-term").textContent = term;
  infoElement.querySelector(".popup__info-description").textContent = description;

  return infoElement;
};

const createUserPreview = (userName) => {
  const userElement = document
    .getElementById("popup-info-user-preview-template")
    .content.querySelector(".popup__list-item")
    .cloneNode(true);

  userElement.textContent = userName;

  return userElement;
};

const renderUserInfo = (userData) => {
  profileTitle.textContent = userData.name;
  profileDescription.textContent = userData.about;
  profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
};

const cardHandlers = {
  onPreviewPicture: handlePreviewPicture,
  onLikeIcon: handleLikeClick,
  onDeleteCard: handleDeleteClick,
  onInfoClick: handleInfoClick,
};

const renderCards = (cards, userId) => {
  cards.forEach((cardData) => {
    placesWrap.append(createCardElement(cardData, userId, cardHandlers));
  });
};

function handlePreviewPicture({ name, link }) {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
}

function handleLikeClick(cardId, cardElement, likeButton) {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((cardData) => {
      updateCardLikeState(cardElement, cardData, currentUserId);
    })
    .catch((err) => {
      console.log(err);
    });
}

function handleDeleteClick(cardId, cardElement) {
  cardIdToDelete = cardId;
  cardElementToDelete = cardElement;
  openModalWindow(deleteCardModalWindow);
}

function handleInfoClick(cardId) {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);

      if (!cardData) {
        return;
      }

      cardInfoModalInfoList.replaceChildren();
      cardInfoModalUserList.replaceChildren();
      cardInfoModalTitle.textContent = "Информация о карточке";

      cardInfoModalInfoList.append(
        createInfoString("Описание:", cardData.name),
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        ),
        createInfoString("Владелец:", cardData.owner.name),
        createInfoString("Количество лайков:", String(cardData.likes.length))
      );

      cardInfoModalText.textContent = "Лайкнули:";

      cardData.likes.forEach((user) => {
        cardInfoModalUserList.append(createUserPreview(user.name));
      });

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
}

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  setButtonLoadingState(profileSubmitButton, true, "Сохранение...", "Сохранить");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      renderUserInfo(userData);
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(
        profileSubmitButton,
        false,
        "Сохранение...",
        "Сохранить"
      );
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();

  setButtonLoadingState(avatarSubmitButton, true, "Сохранение...", "Сохранить");

  setUserAvatar({
    avatar: avatarInput.value,
  })
    .then((userData) => {
      renderUserInfo(userData);
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(
        avatarSubmitButton,
        false,
        "Сохранение...",
        "Сохранить"
      );
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();

  setButtonLoadingState(cardSubmitButton, true, "Создание...", "Создать");

  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, currentUserId, cardHandlers)
      );
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(cardSubmitButton, false, "Создание...", "Создать");
    });
};

const handleDeleteCardFormSubmit = (evt) => {
  evt.preventDefault();

  setButtonLoadingState(deleteCardSubmitButton, true, "Удаление...", "Да");

  deleteCardFromServer(cardIdToDelete)
    .then(() => {
      deleteCardElement(cardElementToDelete);
      closeModalWindow(deleteCardModalWindow);
      cardIdToDelete = null;
      cardElementToDelete = null;
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(deleteCardSubmitButton, false, "Удаление...", "Да");
    });
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
deleteCardForm.addEventListener("submit", handleDeleteCardFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

enableValidation(validationSettings);

const userDataPromise = getUserInfo();
const cardsDataPromise = getCardList();

userDataPromise
  .then((userData) => {
    currentUserId = userData._id;
    renderUserInfo(userData);
  })
  .catch((err) => {
    console.log(err);
  });

Promise.all([cardsDataPromise, userDataPromise])
  .then(([cards]) => {
    renderCards(cards, currentUserId);
  })
  .catch((err) => {
    console.log(err);
  });
