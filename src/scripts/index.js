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
  deleteCard,
  changeLikeCardStatus,
} from "./components/api.js";
import { createCardElement, updateCardLikeState } from "./components/card.js";
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
const profileSubmitButton = profileForm.querySelector(".popup__button");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description"
);

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardSubmitButton = cardForm.querySelector(".popup__button");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

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
const avatarSubmitButton = avatarForm.querySelector(".popup__button");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");
const removeCardSubmitButton = removeCardForm.querySelector(".popup__button");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalUserList = cardInfoModalWindow.querySelector(".popup__list");

let currentUserId = "";
let cardToDelete = null;
const pendingLikeCardIds = new Set();
const pendingInfoCardIds = new Set();
const cardsCache = new Map();
let activeInfoCardId = null;
let infoCardsRequest = null;

const cardHandlers = {
  onPreviewPicture: null,
  onLikeIcon: null,
  onDeleteCard: null,
  onInfoClick: null,
};

const setButtonLoadingState = (button, isLoading, loadingText) => {
  if (isLoading) {
    button.dataset.defaultText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.defaultText;
  button.disabled = false;
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getInfoTemplate = () => {
  return document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);
};

const createInfoString = (term, description) => {
  const infoElement = getInfoTemplate();
  infoElement.querySelector(".popup__info-term").textContent = term;
  infoElement.querySelector(".popup__info-description").textContent = description;
  return infoElement;
};

const getUserPreviewTemplate = () => {
  return document
    .getElementById("popup-info-user-preview-template")
    .content.querySelector(".popup__list-item")
    .cloneNode(true);
};

const updateCardsCache = (cards) => {
  cards.forEach((cardData) => {
    cardsCache.set(cardData._id, cardData);
  });
};

const updateCardInCache = (cardData) => {
  if (cardData?._id) {
    cardsCache.set(cardData._id, cardData);
  }
};

const requestCardsForInfo = () => {
  if (!infoCardsRequest) {
    infoCardsRequest = getCardList()
      .then((cards) => {
        updateCardsCache(cards);
        return cards;
      })
      .finally(() => {
        infoCardsRequest = null;
      });
  }

  return infoCardsRequest;
};

const renderCards = (cards) => {
  cards.forEach((cardData) => {
    placesWrap.append(
      createCardElement(cardData, currentUserId, cardHandlers)
    );
  });
};

const fillCardInfoModal = (cardData) => {
  cardInfoModalTitle.textContent = "Информация о карточке";
  cardInfoModalInfoList.replaceChildren();
  cardInfoModalUserList.replaceChildren();

  if (!cardData) {
    cardInfoModalInfoList.append(createInfoString("Загрузка:", "…"));
    cardInfoModalText.textContent = "";
    return;
  }

  cardInfoModalInfoList.append(
    createInfoString("Описание:", cardData.name),
    createInfoString(
      "Дата создания:",
      formatDate(new Date(cardData.createdAt))
    ),
    createInfoString("Владелец:", cardData.owner.name),
    createInfoString("Количество лайков:", String(cardData.likes.length))
  );

  if (cardData.likes.length > 0) {
    cardInfoModalText.textContent = "Лайкнули:";

    cardData.likes.forEach((user) => {
      const userPreviewElement = getUserPreviewTemplate();
      userPreviewElement.textContent = user.name;
      cardInfoModalUserList.append(userPreviewElement);
    });
  } else {
    cardInfoModalText.textContent = "";
  }
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const syncCardLikeState = (cardElement) => {
  const cardId = cardElement.dataset.cardId;

  return getCardList().then((cards) => {
    updateCardsCache(cards);
    const cardData = cards.find((card) => card._id === cardId);

    if (cardData) {
      updateCardLikeState(cardElement, cardData, currentUserId);
    }
  });
};

const handleLikeClick = (cardElement, likeButton) => {
  const cardId = cardElement.dataset.cardId;

  if (!cardId || pendingLikeCardIds.has(cardId)) {
    return;
  }

  pendingLikeCardIds.add(cardId);
  likeButton.disabled = true;

  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((cardData) => {
      updateCardInCache(cardData);
      updateCardLikeState(cardElement, cardData, currentUserId);
    })
    .catch((err) => {
      console.log(err);
      return syncCardLikeState(cardElement);
    })
    .finally(() => {
      pendingLikeCardIds.delete(cardId);
      likeButton.disabled = false;
    });
};

const handleDeleteCardClick = (cardElement) => {
  cardToDelete = cardElement;
  openModalWindow(removeCardModalWindow);
};

const handleRemoveCardSubmit = (evt) => {
  evt.preventDefault();
  const cardId = cardToDelete.dataset.cardId;

  setButtonLoadingState(removeCardSubmitButton, true, "Удаление…");

  deleteCard(cardId)
    .then(() => {
      cardsCache.delete(cardId);
      cardToDelete.remove();
      cardToDelete = null;
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(removeCardSubmitButton, false);
    });
};

const resetCardToDelete = () => {
  cardToDelete = null;
};

const handleInfoClick = (cardId, infoButton) => {
  if (!cardId) {
    return;
  }

  activeInfoCardId = cardId;
  fillCardInfoModal(cardsCache.get(cardId));
  openModalWindow(cardInfoModalWindow);

  if (pendingInfoCardIds.has(cardId)) {
    return;
  }

  pendingInfoCardIds.add(cardId);
  infoButton.disabled = true;

  requestCardsForInfo()
    .then(() => {
      if (activeInfoCardId !== cardId) {
        return;
      }

      fillCardInfoModal(cardsCache.get(cardId));
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      pendingInfoCardIds.delete(cardId);
      infoButton.disabled = false;
    });
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  setButtonLoadingState(profileSubmitButton, true, "Сохранение…");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(profileSubmitButton, false);
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  setButtonLoadingState(avatarSubmitButton, true, "Сохранение…");

  setUserAvatar({
    avatar: avatarInput.value,
  })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(avatarSubmitButton, false);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  setButtonLoadingState(cardSubmitButton, true, "Создание…");

  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      updateCardInCache(cardData);
      placesWrap.prepend(
        createCardElement(cardData, currentUserId, cardHandlers)
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoadingState(cardSubmitButton, false);
    });
};

cardHandlers.onPreviewPicture = handlePreviewPicture;
cardHandlers.onLikeIcon = handleLikeClick;
cardHandlers.onDeleteCard = handleDeleteCardClick;
cardHandlers.onInfoClick = handleInfoClick;

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardSubmit);

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

removeCardModalWindow.querySelector(".popup__close").addEventListener("click", resetCardToDelete);
removeCardModalWindow.addEventListener("mousedown", (evt) => {
  if (evt.target.classList.contains("popup")) {
    resetCardToDelete();
  }
});

document.addEventListener("keyup", (evt) => {
  if (evt.key === "Escape" && removeCardModalWindow.classList.contains("popup_is-opened")) {
    resetCardToDelete();
  }
});

enableValidation(validationSettings);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    updateCardsCache(cards);
    renderCards(cards);
  })
  .catch((err) => {
    console.log(err);
  });
