import html2canvas from 'html2canvas'

const TRACK_FREQ = 60

const configureTracking = (url, participantKey) => {
  const trackingURL = `${url}/tracking?key=${participantKey}`

  setInterval(() => {
    const lastTrackingTimestamp = localStorage.getItem('lastTrackingTimestamp')

    //TO-DO generate hash to not send if someon leave it open 

    if (lastTrackingTimestamp < Date.now() - TRACK_FREQ * 1000) {
      localStorage.setItem('lastTrackingTimestamp', Date.now())

      html2canvas(document.body).then(canvas => {
        window.nativeFetch(trackingURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tracking: {
              image: canvas.toDataURL(),
              content: document.body.innerHTML
            }
          })
        })
      })
    }
  }, 5000);
}

export default configureTracking
