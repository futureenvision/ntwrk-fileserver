import {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { extension } from "https://deno.land/std@0.152.0/media_types/mod.ts";

const port = 8080;
const app = new Application();
const router = new Router();

router.get("/", async (ctx) => {
  const file = ctx.request.url.searchParams.get("file");
  console.log("[file] ->", file);
  const filePath = `.${file}`;
  await send(ctx, filePath, {
    root: "./",
  });
});

router.post("/", async (ctx) => {
  const result = ctx.request.body();
  console.log("[result] ->", result);
  if (result.type === "json") {
    try {
      const body = await result.value;
      const res = await fetch(body?.url);
      const _mine = extension(`${res.headers.get("content-type")}`);
      const id = crypto.randomUUID();

      let file_name = `/files/${id}.${_mine}`;
      if (
        _mine === "jpeg" ||
        _mine === "jpg" ||
        _mine === "png" ||
        _mine === "gif" ||
        _mine === "webp" ||
        _mine === "svg" ||
        _mine === "bmp" ||
        _mine === "ico" ||
        _mine === "tiff"
      ) {
        file_name = `/images/${id}.${_mine}`;
      }

      const file = await Deno.open(`.${file_name}`, { create: true, write: true });
      await res.body?.pipeTo(file.writable);

      ctx.response.body = { data: file_name, error: null };
    } catch (error) {
      ctx.response.body = { data: null, error: `bad request: ${error}` };
    }
  } else {
    ctx.response.body = { data: null, error: "bad request" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`server running on port ${port}`);
await app.listen({ port });
