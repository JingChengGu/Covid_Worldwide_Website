import { writable } from 'svelte/store';

export const playing = writable(false);

export const currentHeadline = writable(''); // Initialize with an empty string