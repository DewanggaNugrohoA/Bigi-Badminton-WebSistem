import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanWaNumber, buildWaLink, WA_RESERVATION_TEMPLATE } from '../resources/js/lib/content.ts';

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

    // Should return '#' if phone is empty
    assert.equal(buildWaLink(''), '#');
    assert.equal(buildWaLink(null), '#');
    assert.equal(buildWaLink(undefined), '#');
});
