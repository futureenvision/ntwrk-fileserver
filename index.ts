import { extension } from "https://deno.land/std@0.152.0/media_types/mod.ts";

const port = 8000;
const server = Deno.listen({ port });
console.log(`server running on port ${port}`);

// Open a cache named v1.
const CACHE = await caches.open("v1");

for await (const conn of server) {
  handleHttp(conn).catch(console.error);
}

async function handleHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const { request, respondWith } of httpConn) {
    console.log("[request] ->", request);
    console.log("[request.method] ->", request.method);

    const { searchParams } = new URL(request.url);

    if (request.method === "GET") {
      const resp = await CACHE.match(request);
      if (resp) {
        resp.headers.set("x-cache-hit", "true");
        await respondWith(resp);
      } else{

        const filepath = searchParams.get("file");
        console.log("[filepath] ->", filepath);
  
        // wait for 1000ms
        setTimeout


        if (!filepath) {
          console.log("Bad request");
          const notFoundResponse = new Response("404 Not Found", {
            status: 404,
          });
          await respondWith(notFoundResponse);
        }
  
        try {
          const file = await Deno.open("." + filepath, { read: true });
          const readableStream = file.readable;
          const response = new Response(readableStream);
          await CACHE.put(request, response.clone());
          await respondWith(response);
        } catch {
          const notFoundResponse = new Response("404 Not Found", { status: 404 });
          await respondWith(notFoundResponse);
        }
      }
    } else if (request.method === "POST") {
      try {
        const filepath = searchParams.get("file");
        console.log("[filepath] ->", filepath);

        if (!filepath) {
          console.log("Bad request");
          const notFoundResponse = new Response("404 Not Found", {
            status: 404,
          });
          await respondWith(notFoundResponse);
        } else {
          const res = await fetch(filepath);
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

          const file = await Deno.open(`.${file_name}`, {
            create: true,
            write: true,
          });
          await res.body?.pipeTo(file.writable);

          const response = new Response(JSON.stringify({ data: file_name }), {
            headers: new Headers({
              "content-type": "application/json",
            }),
          });
          await respondWith(response);
        }
      } catch (error) {
        console.log("Bad request: ", error);
        const notFoundResponse = new Response("404 Not Found", { status: 404 });
        await respondWith(notFoundResponse);
      }
    } else {
      console.log("Bad request:   ", request.method);
      const notFoundResponse = new Response("404 Not Found", { status: 404 });
      await respondWith(notFoundResponse);
    }
  }
}
