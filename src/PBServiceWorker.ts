// This is the Service Worker code.  It is registered in PBEarTraining.
// Note that the console messages will only show up when the Service
// Worker is registered the first time.
// Unsure why the [fetch] console messages are not showing up.
//

let CACHE_NAME = 'EarTraining-cache';

// Files required to make this app work offline
let REQUIRED_FILES = [
    '../basic.css',
    '../index.html',
     '../built/PBCharacterInput.js',
    '../built/PBConst.js',
    '../built/PBEarTraining.js',
    '../built/PBNotation.js',
    '../built/PBNotation.js',
    '../built/PBPianoKeyboard.js',
    '../built/PBSequencer.js',
    '../built/PBServiceWorker.js',
    '../built/PBSounds.js',
    '../built/PBStatusWindow.js',
    '../built/PBTester.js',
    '../built/PBUI.js',
    '../assets/fonts/Aruvarb.ttf',
    '../assets/fonts/ionicons.ttf',
    '../assets/sounds/instruments.txt',
    '../assets/sounds/piano/58.mp3',
    '../assets/sounds/piano/59.mp3',
    '../assets/sounds/piano/60.mp3',
    '../assets/sounds/piano/61.mp3',
    '../assets/sounds/piano/62.mp3',
    '../assets/sounds/piano/63.mp3',
    '../assets/sounds/piano/64.mp3',
    '../assets/sounds/piano/65.mp3',
    '../assets/sounds/piano/66.mp3',
    '../assets/sounds/piano/67.mp3',
    '../assets/sounds/piano/68.mp3',
    '../assets/sounds/piano/69.mp3',
    '../assets/sounds/piano/70.mp3',
    '../assets/sounds/piano/71.mp3',
    '../assets/sounds/piano/72.mp3',
    '../assets/sounds/piano/73.mp3'
];

console.log('Inside PBServiceWorker.js');

self.addEventListener('install', (event: InstallEvent) => {
    // Perform install step:  loading each required file into cache
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Add all offline dependencies to the cache
                console.log('[install] Caches opened, adding all core components to cache');
                return cache.addAll(REQUIRED_FILES);
            })
            .then(() => {
                console.log('[install] All required resources have been cached: we\'re good!');
                return self.skipWaiting();
            }).catch((typeError) => {
                let x = 5;
                console.log('[install] Error: ' + typeError + '  ' + x)})
    );
});

self.addEventListener('fetch', function(event: FetchEvent) {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                    // Cache hit - return the response from the cached version
                    if (response) {
                        console.log('[fetch] Returning from ServiceWorker cache: ', event.request.url);
                        return response;
                    }

                    // Not in cache - return the result from the live server
                    // `fetch` is essentially a "fallback"
                    console.log('[fetch] Returning from server: ', event.request.url);
                    return fetch(event.request);
                }
            )
    );
});

self.addEventListener('activate', (event: ActivateEvent) => {
    console.log('[activate] Activating ServiceWorker!');

    // Calling claim() to force a "controllerchange" event on navigator.serviceWorker
    console.log('[activate] Claiming this ServiceWorker!');
    event.waitUntil(self.clients.claim());
});
