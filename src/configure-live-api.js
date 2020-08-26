import monkeypatchFetch from './fetch-monkeypatch'
import configureTracking from './configure-tracking'

const configureLiveApi = (url, participantKey, tracking = true) => {
  monkeypatchFetch(url, participantKey)

  if(tracking) {
    configureTracking(url, participantKey)
  }
}

export default configureLiveApi
