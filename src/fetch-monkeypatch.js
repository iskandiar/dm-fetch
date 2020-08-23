const monkeypatchFetch = (url, participantKey) => {
  window.nativeFetch = fetch
  window.fetch = function () {
    const args = arguments

    args[0] = `${url}${args[0]}?key=${participantKey}`


    return Promise.resolve(window.nativeFetch.apply(window, args))
  }
}

export default monkeypatchFetch
