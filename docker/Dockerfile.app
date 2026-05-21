FROM public.ecr.aws/docker/library/node:22-alpine

RUN apk add --no-cache libc6-compat
RUN corepack enable

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

ARG APP_NAME
ARG APP_PORT=4000
ARG NODE_ENV=development

ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${APP_PORT}

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=${APP_NAME}

EXPOSE ${APP_PORT}

CMD ["sh", "-c", "node --stack-trace-limit=20 ./apps/${APP_NAME}/dist/apps/${APP_NAME}/src/main.js"]
