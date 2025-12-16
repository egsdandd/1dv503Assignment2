// utils/validators.js
import validator from 'validator'

export function validateLoginInput(email, password) {
    const errors = []

    if (!email) errors.push('Email is required.')
    if (!password) errors.push('Password is required.')

    return errors
}

export function validateRegisterInput(data) {
    const errors = []
    const { firstName, lastName, address, city, zip, phone, email, password } = data

    if (!firstName || !lastName) {
        errors.push('First and last name are required.')
    }

    if (!address || !city) {
        errors.push('Address and city are required.')
    }

    if (!zip || !validator.isPostalCode(zip + '', 'any')) {
        errors.push('Invalid zip code.')
    }

    if (!phone) {
        errors.push('Phone number is required.')
    }

    if (!email || !validator.isEmail(email)) {
        errors.push('Invalid email.')
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters.')
    }

    return errors
}

export function parsePositiveInteger(value, defaultValue) {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) || parsed < 1 ? defaultValue : parsed
}

export function extractFilters(query) {
    return {
        subject: query.subject || '',
        author: query.author || '',
        title: query.title || ''
    }
}

export function convertEmptyToNull(value) {
    return value || null
}
