import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

export const GET: APIRoute = async ({ site }): Promise<Response> => {
    const docs = await getCollection("docs");
    const blog = docs
        .filter((p) => p.id.startsWith("blog/") && p.id !== "blog/index.mdx")
        // @ts-expect-error data.date could be undefined, but on our blog it should always be defined
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
    return await rss({
        // `<title>` field in output xml
        title: "BlueBuild Blog",
        // `<description>` field in output xml
        description:
            "This is where the BlueBuild team publishes announcements and writeups. Enjoy!",
        // Pull in your project "site" from the endpoint context
        // https://docs.astro.build/en/reference/api-reference/#contextsite
        site: site ?? "https://blue-build.org/",
        // Array of `<item>`s in output xml
        // See "Generating items" section for examples using content collections and glob imports
        items: blog.map((post) => ({
            title: post.data.title,
            pubDate: post.data.date,
            description: post.data.description,
            link: post.id,
            content: sanitizeHtml(parser.render(post.body ?? ""), {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
            }),
        })),
        // (optional) inject custom xml
        customData: `<language>en-us</language>`,
    });
};
