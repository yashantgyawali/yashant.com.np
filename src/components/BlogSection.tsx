
import React from 'react';

interface BlogCardProps {
  title: string;
  image: string;
  link: string;
}

const BlogCard = ({ title, image, link }: BlogCardProps) => {
  return (
    <div className="card-block-adapt">
      <a href={link} target="_blank" rel="noopener noreferrer">
        <div className="link-block2 bg-white">
          <img className="project-img rounded-t-lg" src={image} alt={title} />
          <p className="card-title py-3 text-secondary">{title}</p>
        </div>
      </a>
    </div>
  );
};

const BlogSection = () => {
  const blogs = [
    {
      title: "Neumorphism, The Hottest design in 2020",
      image: "https://placehold.co/800x500/FFFFFF/1B2331?text=Neumorphism",
      link: "https://medium.com/@yashantgyawali/neomorphism-the-hottest-design-trend-in-2020-8bd65de77a5e"
    },
    {
      title: "Learn UX through a fruit",
      image: "https://placehold.co/800x500/FFFFFF/1B2331?text=Learn+UX",
      link: "https://bootcamp.uxdesign.cc/learn-ux-through-fruits-in-progress-d6cc56c0a39d"
    },
    {
      title: "30-Day CSS Challenge",
      image: "https://placehold.co/800x500/FFFFFF/1B2331?text=CSS+Challenge",
      link: "https://bootcamp.uxdesign.cc/i-designed-and-completed-a-30-day-css-challenge-4e45c32f7f8c"
    },
    {
      title: "Proposed Research- Games & Lucid Dreaming",
      image: "https://placehold.co/800x500/FFFFFF/1B2331?text=Lucid+Dreaming",
      link: "https://www.researchgate.net/publication/342988874_The_Effects_of_Different_Genres_of_Video_Games_on_Lucid_Dreaming"
    },
    {
      title: "Games Genre & Lucid Dreaming",
      image: "https://placehold.co/800x500/FFFFFF/1B2331?text=Game+Genre",
      link: "https://www.researchgate.net/publication/342991234_The_Effects_of_Video_Games_on_the_Frequency_of_Lucid_Dreaming"
    },
    {
      title: "Web Aesthetic & Positive Psych",
      image: "https://placehold.co/800x500/FFFFFF/1B2331?text=Web+Aesthetic",
      link: "https://www.researchgate.net/publication/342991380_The_Relationship_between_Aesthetic_Design_of_a_Website_and_Positive_Psychology"
    }
  ];

  return (
    <section id="blogs" className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-secondary">Research, blogs & Articles</h2>
        
        <div className="flex-center">
          {blogs.map((blog, index) => (
            <BlogCard key={index} {...blog} />
          ))}
        </div>
        
        <div className="text-center mt-12 text-secondary">
          <p>
            Think you can beat me in a game of Table Tennis? Let me know{" "}
            <a 
              className="text-primary hover:underline font-bold" 
              href="https://yashantgyawali.typeform.com/to/rbizSifr" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              here
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
