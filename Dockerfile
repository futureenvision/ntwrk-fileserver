FROM denoland/deno:1.26.1

EXPOSE 8080

WORKDIR /app

USER deno

COPY . .
RUN deno cache index.ts

CMD ["run", "--allow-all", "index.ts"]
