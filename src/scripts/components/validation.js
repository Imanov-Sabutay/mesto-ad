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

const disableSubmitButton = (submitButton, settings) => {
  const { inactiveButtonClass } = settings;

  submitButton.classList.add(inactiveButtonClass);
  submitButton.disabled = true;
};

const enableSubmitButton = (submitButton, settings) => {
  const { inactiveButtonClass } = settings;

  submitButton.classList.remove(inactiveButtonClass);
  submitButton.disabled = false;
};

const toggleButtonState = (formElement, submitButton, settings) => {
  if (hasInvalidInput(formElement, settings)) {
    disableSubmitButton(submitButton, settings);
  } else {
    enableSubmitButton(submitButton, settings);
  }
};

const setEventListeners = (formElement, settings) => {
  const { inputSelector, submitButtonSelector } = settings;
  const inputList = formElement.querySelectorAll(inputSelector);
  const submitButton = formElement.querySelector(submitButtonSelector);

  inputList.forEach((inputElement) => {
    inputElement.addEventListener("input", () => {
      checkInputValidity(formElement, inputElement, settings);
      toggleButtonState(formElement, submitButton, settings);
    });
  });
};

export const clearValidation = (formElement, settings) => {
  const { inputSelector, submitButtonSelector } = settings;
  const inputList = formElement.querySelectorAll(inputSelector);
  const submitButton = formElement.querySelector(submitButtonSelector);

  inputList.forEach((inputElement) => {
    hideInputError(formElement, inputElement, settings);
  });

  disableSubmitButton(submitButton, settings);
};

export const enableValidation = (settings) => {
  const { formSelector, inputSelector, submitButtonSelector } = settings;
  const formList = document.querySelectorAll(formSelector);

  formList.forEach((formElement) => {
    if (!formElement.querySelector(inputSelector)) {
      return;
    }

    const submitButton = formElement.querySelector(submitButtonSelector);

    setEventListeners(formElement, settings);
    disableSubmitButton(submitButton, settings);
  });
};
