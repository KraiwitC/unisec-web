import Header from "../../../components/Header";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Parallex from "../../../components/Parallex";
import { PortableText } from "next-sanity";
import Image from "next/image";
import { imageUrlFor, fileUrlFor } from "../../sanity/sanityClient";
import { getPostBySlug } from "../../sanity/sanityClient";
import { getAllSlugs } from "../../sanity/sanityClient";

const textComponents = {
  types: {
    image: ({ value }) => (
      <div className="my-4">
        <Image
          src={imageUrlFor(value).width(800).url()}
          alt={value.alt || "Image"}
          width={800}
          height={600}
          className="rounded-md shadow-md"
          style={{ objectFit: "contain" }}
        />
        {value.caption && (
          <p className="text-sm text-gray-500 font-serif italic">
            {value.caption}
          </p>
        )}
      </div>
    ),
    // Render file downloads
    file: ({ value }) => (
      <div className="my-4">
        <a
          href={fileUrlFor(value)}
          download
          className="text-blue-500 underline font-mono"
        >
          Download File
        </a>
        {value.caption && (
          <p className="text-sm text-gray-500 font-serif italic">
            {value.caption}
          </p>
        )}
      </div>
    ),
  },
  block: {
    h1: ({ children }) => (
      <h1 className="text-6xl font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-5xl font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-4xl font-bold mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-3xl font-bold mb-2">{children}</h4>
    ),
    normal: ({ children }) => <p className="text-3xl mt-0">{children}</p>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {children}
      </a>
    ),
    fileLink: ({ value, children }) => (
      <a href={fileUrlFor(value)}>{children}</a>
    ),
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-200 p-1 rounded">{children}</code>
    ),
  },
};

const Blog = (props) => {
  if (props.type == "MEETING") {
    return (
      <div className="relative min-h-screen bg-gradient">
        <Header
          blog
          title={props.title}
          description={props.description}
          author={props.author}
          cover={props.cover}
        />
        <main className="pb-20 pt-[88px] md:pt-[96px]">
          <Navbar />
          <div className="flex justify-center">
            <Image
              src={
                props.cover
                  ? imageUrlFor(props.cover).url()
                  : "/assets/blank.webp"
              }
              width={960}
              height={540}
              alt="cover"
              className="max-h-140"
              style={{ objectFit: "contain", width: "auto" }}
            />
          </div>
          <div className="container mx-auto p-8 border-b-2 border-white">
            <h1 className="break-words font-bold text-5xl font-helvethaica-med-cond my-4">
              {props.title}
            </h1>
            <article>
              <PortableText value={props.body} components={textComponents} />
            </article>
          </div>
          {props.youtube != "none" && (
            <div className="container mx-auto p-6 flex justify-center border-b-2 border-white">
              <iframe
                width="960"
                height="540"
                src={"https://www.youtube.com/embed/" + props.youtube}
              ></iframe>
            </div>
          )}
          {props.capture && (
            <div className="flex justify-center p-6">
              <Image
                src={imageUrlFor(props.capture).url()}
                width={960}
                height={540}
                alt="capture"
                className="max-h-140"
                style={{ objectFit: "contain", width: "auto" }}
              />
            </div>
          )}
        </main>
        <footer className="absolute top-full w-full">
          <Footer />
        </footer>
      </div>
    );
  } else {
    return (
      <div className="relative min-h-screen bg-gradient">
        <Header
          blog
          title={props.title}
          description={props.description}
          author={props.author}
          cover={props.cover}
        />

        <main className="pb-20 pt-[88px] md:pt-[96px]">
          <Navbar />
          <Parallex
            image={
              props.cover
                ? imageUrlFor(props.cover).url()
                : "/assets/space.webp"
            }
            darken={true}
          >
            <div className="w-full mx-auto">
              <div className="font-helvethaica-med-cond text-2xl lg:text-3xl text-center text-shadow">
                {"UNISEC Thailand"}
              </div>
              <h1 className="font-helvethaica-blk-cond text-4xl lg:text-6xl text-center text-shadow">
                {props.title}
              </h1>
              <div className="text-gray-100 text-center mt-16 text-shadow">
                {props.date_to == undefined
                  ? new Date(props.date).toLocaleDateString("en-EN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : new Date(props.date).toLocaleDateString("en-EN", {
                      month: "long",
                      day: "numeric",
                    }) +
                    " - " +
                    new Date(props.date_to).toLocaleDateString("en-EN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </div>
            </div>
          </Parallex>
          <div className="">
            <div className="container mx-auto p-8 border-white">
              <h1 className="break-words font-bold text-5xl font-helvethaica-med-cond my-4">
                {props.title}
              </h1>
              <article>
                <PortableText value={props.body} components={textComponents} />
              </article>
            </div>
          </div>
        </main>
        <footer className="absolute top-full w-full">
          <Footer />
        </footer>
      </div>
    );
  }
};

export async function getStaticProps(ctx) {
  const slug = ctx.params.slug;
  const articles = await getPostBySlug(slug);
  return {
    props: {
      ...articles,
    },
    revalidate: 300,
  };
}

export async function getStaticPaths() {
  const slugs = await getAllSlugs();
  const paths = slugs.map((slug) => ({
    params: { slug: slug.slug.current },
  }));

  return {
    paths,
    fallback: "blocking",
  };
}

export default Blog;
