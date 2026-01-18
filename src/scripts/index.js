/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { enableValidation, clearValidation } from "./components/validation.js";
import { 
  getUserInfo, 
  getInitialCards, 
  updateUserInfo, 
  addNewCard, 
  updateUserAvatar,
  deleteCardApi,
  likeCardApi
} from "./components/api.js";
import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";

let userId = null;
let cardToDelete = null; 
let cardIdToDelete = "";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
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
const avatarInput = avatarForm.querySelector(".popup__input");

const deleteCardModalWindow = document.querySelector(".popup_type_remove-card");
const deleteCardForm = deleteCardModalWindow.querySelector(".popup__form");

const logo = document.querySelector(".header__logo");
const infoModal = document.querySelector(".popup_type_info");
const infoList = infoModal.querySelector(".popup__info");
const infoUserList = infoModal.querySelector(".popup__list");
const infoTitle = infoModal.querySelector(".popup__title");
const infoText = infoModal.querySelector(".popup__text");

const infoDefinitionTemplate = document.querySelector("#popup-info-definition-template").content;
const infoUserPreviewTemplate = document.querySelector("#popup-info-user-preview-template").content;

const handleLikeIcon = (cardId, likeButton, likeCounter) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  likeCardApi(cardId, isLiked)
    .then((updatedCard) => {
      likeCard(likeButton, likeCounter, updatedCard);
    })
    .catch((err) => console.log(err));
};

const handleDeleteCard = (cardId, cardElement) => {
  cardIdToDelete = cardId;
  cardToDelete = cardElement;
  
  openModalWindow(deleteCardModalWindow);
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  updateUserInfo(profileTitleInput.value, profileDescriptionInput.value)
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => {
      submitButton.textContent = initialText;
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  updateUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => console.log(err))
    .finally(() => {
      submitButton.textContent = initialText;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  submitButton.textContent = "Создание...";

  addNewCard(cardNameInput.value, cardLinkInput.value)
    .then((cardData) => {
      const cardElement = createCardElement(
        cardData, 
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeIcon,
          onDeleteCard: handleDeleteCard,
        },
        userId
      );
      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset(); 
    })
    .catch((err) => console.log(err))
    .finally(() => {
      submitButton.textContent = initialText;
    });
};

const handleDeleteFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  submitButton.textContent = "Удаление...";

  deleteCardApi(cardIdToDelete)
    .then(() => {
      deleteCard(cardToDelete);
      closeModalWindow(deleteCardModalWindow);
      cardToDelete = null;
      cardIdToDelete = "";
    })
    .catch((err) => console.log(err))
    .finally(() => {
      submitButton.textContent = initialText;
    });
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (key, value) => {
  const element = infoDefinitionTemplate.querySelector(".popup__info-item").cloneNode(true);
  element.querySelector(".popup__info-term").textContent = key;
  element.querySelector(".popup__info-description").textContent = value;
  return element;
};

const createUserPreview = (name) => {
  const element = infoUserPreviewTemplate.querySelector(".popup__list-item").cloneNode(true);
  
  element.textContent = name; 
  
  element.title = name;
  
  return element;
};

const handleLogoClick = () => {
  infoList.innerHTML = "";
  infoUserList.innerHTML = "";

  getInitialCards()
    .then((cards) => {
      infoTitle.textContent = "Статистика пользователей"; 
      infoText.textContent = "Все пользователи:";

      const userCardsCount = {};
      const uniqueUsers = [];
      const userIds = new Set();

      cards.forEach(card => {
        const ownerId = card.owner._id;
        
        userCardsCount[ownerId] = (userCardsCount[ownerId] || 0) + 1;

        if (!userIds.has(ownerId)) {
          userIds.add(ownerId);
          uniqueUsers.push(card.owner);
        }
      });

      const maxCards = Math.max(...Object.values(userCardsCount));

      uniqueUsers.forEach(user => {
        infoUserList.append(createUserPreview(user.name));
      });

      infoList.append(createInfoString("Всего карточек:", cards.length));
      
      if (cards.length > 0) {
        const firstCreated = cards[cards.length - 1].createdAt;
        const lastCreated = cards[0].createdAt;

        infoList.append(createInfoString("Первая создана:", formatDate(new Date(firstCreated))));
        infoList.append(createInfoString("Последняя создана:", formatDate(new Date(lastCreated))));
      }

      infoList.append(createInfoString("Всего пользователей:", uniqueUsers.length));
      infoList.append(createInfoString("Максимум карточек от одного:", maxCards));

      openModalWindow(infoModal);
    })
    .catch((err) => console.log(err));
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
deleteCardForm.addEventListener("submit", handleDeleteFormSubmit);

logo.style.cursor = "pointer";
logo.addEventListener("click", handleLogoClick);

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

Promise.all([getUserInfo(), getInitialCards()])
  .then(([userData, cards]) => {
    userId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      const cardElement = createCardElement(
        cardData, 
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeIcon,
          onDeleteCard: handleDeleteCard,
          onInfoClick: handleLogoClick
        },
        userId
      );
      placesWrap.append(cardElement);
    });
  })
  .catch((err) => {
    console.log(err);
  });