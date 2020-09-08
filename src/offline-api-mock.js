import { Server, Model, Serializer, hasMany, belongsTo } from "miragejs"
import { format, formatDistance, subDays as subDaysMethod } from 'date-fns'

const createdHelper = (date = new Date()) => ({
  createdRaw: format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  created: format(date, 'yyyy-MM-dd HH:mm:ss'),
  createdAgo: formatDistance(date, new Date())
})

// TO-DO refactor to object parameter
const tweetFactory = (text, subDays = 0, author = "@anonymous", isAuthor = false, likesCount = Math.floor(Math.random() * 5)) => {
  const date = subDaysMethod(new Date(), subDays)
  return ({
    text,
    isAuthor,
    likesCount,
    likedByMe: false,
    author,
    ...createdHelper(date)
  })
}

const configureOfflineServer = () => {
  const server = new Server({
    models: {
      tweet: Model.extend({
        comments: hasMany(),
      }),
      comment: Model.extend({
        tweet: belongsTo(),
      }),
    },

    serializers: {
      tweet: Serializer.extend({
        include: ["comments"],
        embed: true,
        root: false,
        serialize(_object, request) {
          const json = Serializer.prototype.serialize.apply(this, arguments);

          // The only option to change order of response (GET /tweets)
          if (request.method === 'GET' && request.url === '/tweets') {
            return json.reverse()
          }
          return json
        }
      }),
      comment: Serializer.extend({
        embed: true,
        root: false
      })
    },

    routes() {
      this.get("/tweets", (schema) => {
        return schema.tweets.all()
      }, { timing: 500 })

      this.post("/tweets", (schema, request) => {
        const attrs = JSON.parse(request.requestBody)
        const newTweet = tweetFactory(attrs.tweet.text, 0, "@me", true, 0)

        return schema.tweets.create(newTweet)
      })

      this.del("/tweets/:id")
      this.put("/tweets/:id", (schema, request) => {
        const attrs = JSON.parse(request.requestBody)
        const id = request.params.id

        return schema.tweets.find(id).update('text', attrs.tweet.text)
      })

      this.put('/tweets/:id/like', (schema, request) => {
        const id = request.params.id
        const tweet = schema.tweets.find(id)

        return tweet.update('likesCount', tweet.attrs.likesCount + 1).update('likedByMe', true)
      })

      this.put('/tweets/:id/dislike', (schema, request) => {
        const id = request.params.id
        const tweet = schema.tweets.find(id)

        return tweet.update('likesCount', Math.max(0, tweet.attrs.likesCount - 1)).update('likedByMe', false)
      })

      this.post("/tweets/:id/comments", (schema, request) => {
        const attrs = JSON.parse(request.requestBody)
        const id = request.params.id
        const tweet = schema.tweets.find(id)

        return schema.comments.create({ tweet, text: attrs.comment.text, ...createdHelper(), author: "@me", isAuthor: true })
      })

      this.put("/tweets/:tweet_id/comments/:id", (schema, request) => {
        const attrs = JSON.parse(request.requestBody)
        const id = request.params.id

        return schema.comments.find(id).update('text', attrs.comment.text)
      })

      this.del("/tweets/:tweet_id/comments/:id", (schema, request) => {
        const id = request.params.id

        return schema.comments.find(id).destroy()
      })
    },

    seeds(server) {
      const serverDump = JSON.parse(localStorage.getItem('serverDump'))

      if (serverDump && serverDump.tweets.length > 0) {
        server.db.loadData(serverDump)
      } else {
        server.create("tweet", tweetFactory("Hi everyone!", 3))
        server.create("tweet", tweetFactory("We are the champions!", 2))
        const lastTweet = server.create("tweet", tweetFactory("Let the fun begin!", 1))

        server.create("comment", { tweet: lastTweet, text: "Now You Can See Me.", ...createdHelper(), author: "@anonymous", isAuthor: false })
      }
    },
  })

  window.addEventListener("beforeunload", () => {
    localStorage.setItem('serverDump', JSON.stringify(server.db.dump()))
  })

  window.mirageServer = server
}

export default configureOfflineServer
