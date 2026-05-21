FROM public.ecr.aws/docker/library/node:22-alpine
RUN apk update
RUN apk add --no-cache libc6-compat

RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

ARG PORT=80
ENV PORT=$PORT
EXPOSE $PORT

WORKDIR /app

COPY ./json .

RUN pnpm i --prod

COPY ./full .

CMD ["sh", "-c", "node --stack-trace-limit=20 ./apps/batch/dist/apps/batch/src/main.js"]
