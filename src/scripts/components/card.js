const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (data, userId) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCountElement = cardElement.querySelector(".card__like-count");
  const deleteButton = cardElement.querySelector(
    ".card__control-button_type_delete"
  );
  const cardImage = cardElement.querySelector(".card__image");

  cardElement.dataset.cardId = data._id;
  cardImage.decoding = "async";
  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;
  likeCountElement.textContent = data.likes.length;

  const isLiked = data.likes.some((user) => user._id === userId);
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }

  if (data.owner._id !== userId) {
    deleteButton.remove();
  }

  return cardElement;
};

export const updateCardLikeState = (cardElement, cardData, userId) => {
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCountElement = cardElement.querySelector(".card__like-count");
  const isLiked = cardData.likes.some((user) => user._id === userId);

  likeButton.classList.toggle("card__like-button_is-active", isLiked);
  likeCountElement.textContent = cardData.likes.length;
};
