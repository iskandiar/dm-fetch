import html2canvas from 'html2canvas'

const monkeypatchFetch = (url, participantKey, tracking = true) => {
  const trackingURL = `${url}/tracking`
  const _fetch = fetch

  window.fetch = function () {
    const content = document.body.innerHTML
    const lastTrackingTimestamp = localStorage.getItem('lastTrackingTimestamp')

    const args = arguments

    args[0] = `${url}${args[0]}?key=${participantKey}`

    if (lastTrackingTimestamp < Date.now() - 120 * 1000 && tracking) {
      localStorage.setItem('lastTrackingTimestamp', Date.now())

      html2canvas(document.body).then(canvas => {
        _fetch(trackingURL, {
          method: 'POST',
          body: JSON.stringify({
            preview: canvas.toDataURL(),
            content,
            participantKey
          })
        })
      });
    }

    window.nativeFetch = _fetch

    return Promise.resolve(_fetch.apply(window, args))
  }
}

export default monkeypatchFetch
