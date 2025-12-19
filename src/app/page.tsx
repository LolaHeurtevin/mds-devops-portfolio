import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-[#E8DCB9]">
          Hi, I’m Lola
        </h1>
        <p className="mt-4 text-lg md:text-xl text-[#F2CEE6]">
          A passionate Fullstack Developer crafting clean and scalable solutions.
        </p>
      </section>

      {/* About Section */}
      <section className="max-w-3xl mb-16">
        <h2 className="text-2xl font-semibold text-[#7798AB] mb-4">About Me</h2>
        <p>
          With 3 years of experience in fullstack development, I specialize in
          creating maintainable and scalable applications. My journey through
          alternating work and study has honed my adaptability and
          professionalism.
        </p>
      </section>

      {/* Skills Section */}
      <section className="max-w-3xl mb-16">
        <h2 className="text-2xl font-semibold text-[#7798AB] mb-4">
          Technical Skills
        </h2>
        <ul className="list-disc list-inside">
          <li>Frontend: React, Next.js, Tailwind CSS</li>
          <li>Backend: Node.js, Express, MongoDB</li>
          <li>Tools: Git, Docker, CI/CD</li>
        </ul>
      </section>

      {/* Experience Section */}
      <section className="max-w-3xl mb-16">
        <h2 className="text-2xl font-semibold text-[#7798AB] mb-4">
          Experience
        </h2>
        <p>
          During my 3 years of alternating work and study, I contributed to
          multiple projects, collaborating with teams to deliver high-quality
          software solutions.
        </p>
      </section>

      {/* Projects Section */}
      <section className="max-w-3xl mb-16">
        <h2 className="text-2xl font-semibold text-[#7798AB] mb-4">Projects</h2>
        <p>Coming soon...</p>
      </section>

      {/* Call to Action */}
      <section className="text-center mb-16">
        <h2 className="text-2xl font-semibold text-[#7798AB] mb-4">
          Let’s Work Together
        </h2>
        <p className="mb-4">
          I’m currently looking for full-time opportunities. Let’s connect and
          discuss how I can contribute to your team.
        </p>
        <a
          href="mailto:lola@example.com"
          className="inline-block bg-[#7798AB] text-[#0D1B1E] px-6 py-3 rounded-md font-medium hover:bg-[#C3DBC5]"
        >
          Contact Me
        </a>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-[#C3DBC5]">
        © 2025 Lola. All rights reserved.
      </footer>
    </main>
  );
}
