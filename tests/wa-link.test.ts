import test from 'node:test';
import assert from 'node:assert/strict';
import {
    cleanWaNumber,
    buildWaLink,
    WA_RESERVATION_TEMPLATE,
    formatIndonesianPhoneInput,
    isValidIndonesianPhone,
} from '../resources/js/lib/content.ts';

test('cleanWaNumber removes non-digits and converts leading 0 to 62', () => {
    assert.equal(cleanWaNumber('0812-3456-7890'), '6281234567890');
    assert.equal(cleanWaNumber('+62 812 3456 7890'), '6281234567890');
    assert.equal(cleanWaNumber('0898 (7654) 321'), '628987654321');
    assert.equal(cleanWaNumber('6281234567890'), '6281234567890');
    assert.equal(cleanWaNumber(''), '');
    assert.equal(cleanWaNumber(null), '');
    assert.equal(cleanWaNumber(undefined), '');
});

test('buildWaLink builds valid wa.me link with encoded message template', () => {
    const link = buildWaLink('081234567890');
    assert.match(link, /^https:\/\/wa\.me\/6281234567890\?text=/);
    assert.ok(link.includes(encodeURIComponent('Halo admin Bigi Badminton, saya ingin reservasi lapangan.')));
    assert.ok(link.includes(encodeURIComponent('Nama:')));
    assert.ok(link.includes(encodeURIComponent('Tanggal main:')));
    assert.ok(link.includes(encodeURIComponent('Jam mulai - selesai:')));
    assert.ok(link.includes(encodeURIComponent('Lapangan (1/2):')));
    assert.ok(link.includes(encodeURIComponent('Tipe pelanggan (Member/Non-member):')));

    
    assert.equal(buildWaLink(''), '#');
    assert.equal(buildWaLink(null), '#');
    assert.equal(buildWaLink(undefined), '#');
});

test('formatIndonesianPhoneInput sanitizes characters, enforces 08, and limits to 13 digits', () => {
    
    assert.equal(formatIndonesianPhoneInput('0812-abc-3456'), '08123456');
    assert.equal(formatIndonesianPhoneInput('0812 3456 7890'), '081234567890');

    
    assert.equal(formatIndonesianPhoneInput('+6281234567890'), '081234567890');
    assert.equal(formatIndonesianPhoneInput('6281234567890'), '081234567890');

    
    assert.equal(formatIndonesianPhoneInput('81234567890'), '081234567890');

    
    assert.equal(formatIndonesianPhoneInput('08123456789012345'), '0812345678901');

    
    assert.equal(formatIndonesianPhoneInput(''), '');
});

test('isValidIndonesianPhone validates prefix 08 and 10 to 13 digits length', () => {
    
    assert.equal(isValidIndonesianPhone('0811111111'), true); 
    assert.equal(isValidIndonesianPhone('08123456789'), true); 
    assert.equal(isValidIndonesianPhone('081234567890'), true); 
    assert.equal(isValidIndonesianPhone('0812345678901'), true); 

    
    assert.equal(isValidIndonesianPhone('081234567'), false); 
    assert.equal(isValidIndonesianPhone('08'), false);

    
    assert.equal(isValidIndonesianPhone('08123456789012'), false); 

    
    assert.equal(isValidIndonesianPhone('071234567890'), false);
    assert.equal(isValidIndonesianPhone('6281234567890'), false);
    assert.equal(isValidIndonesianPhone('1212121212121'), false);
});
