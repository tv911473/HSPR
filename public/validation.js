export function validateName(name) {
    const forbiddenChars = /[;:?=\[\]{}<>'"\/\\!@#$%^&*()_+`|~0-9]/;
    return name && !forbiddenChars.test(name);
}

export function capitalizeName(name) {
    return name.replace(/(^|\s|[-'’])\S/g, char => char.toUpperCase());
}

export function checkInput(value) {
    return value > 0 && value <= 120;
}