const showInputError = (formElement, inputElement, errorMessage, settings) => {
  const { inputErrorClass, errorClass } = settings;
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);

  inputElement.classList.add(inputErrorClass);
  errorElement.textContent = errorMessage;
  errorElement.classList.add(errorClass);
};

const hideInputError = (formElement, inputElement, settings) => {
  const { inputErrorClass, errorClass } = settings;
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);

  inputElement.classList.remove(inputErrorClass);
  errorElement.textContent = "";
  errorElement.classList.remove(errorClass);
};

const checkInputValidity = (formElement, inputElement, settings) => {
  if (inputElement.validity.valid) {
    hideInputError(formElement, inputElement, settings);
  } else {
    let errorMessage = inputElement.validationMessage;

    if (inputElement.dataset.errorMessage && inputElement.validity.patternMismatch) {
      errorMessage = inputElement.dataset.errorMessage;
    }

    showInputError(formElement, inputElement, errorMessage, settings);
  }
};

const hasInvalidInput = (formElement, settings) => {
  const { inputSelector } = settings;

  return Array.from(formElement.querySelectorAll(inputSelector)).some(
    (inputElement) => !inputElement.validity.valid
  );
};

const disableSubmitButton = (formElement, settings) => {
  const { inactiveButtonClass, submitButtonSelector } = settings;
  const submitButton = formElement.querySelector(submitButtonSelector);

  submitButton.classList.add(inactiveButtonClass);
  submitButton.disabled = true;
};

const enableSubmitButton = (formElement, settings) => {
  const { inactiveButtonClass, submitButtonSelector } = settings;
  const submitButton = formElement.querySelector(submitButtonSelector);

  submitButton.classList.remove(inactiveButtonClass);
  submitButton.disabled = false;
};

const toggleButtonState = (formElement, settings) => {
  if (hasInvalidInput(formElement, settings)) {
    disableSubmitButton(formElement, settings);
  } else {
    enableSubmitButton(formElement, settings);
  }
};

const setEventListeners = (formElement, settings) => {
  const { inputSelector } = settings;
  const inputList = formElement.querySelectorAll(inputSelector);

  inputList.forEach((inputElement) => {
    inputElement.addEventListener("input", () => {
      checkInputValidity(formElement, inputElement, settings);
      toggleButtonState(formElement, settings);
    });
  });
};

export const clearValidation = (formElement, settings) => {
  const { inputSelector } = settings;
  const inputList = formElement.querySelectorAll(inputSelector);

  inputList.forEach((inputElement) => {
    hideInputError(formElement, inputElement, settings);
  });

  disableSubmitButton(formElement, settings);
};

export const enableValidation = (settings) => {
  const { formSelector, inputSelector } = settings;
  const formList = document.querySelectorAll(formSelector);

  formList.forEach((formElement) => {
    if (!formElement.querySelector(inputSelector)) {
      return;
    }

    setEventListeners(formElement, settings);
    disableSubmitButton(formElement, settings);
  });
};
