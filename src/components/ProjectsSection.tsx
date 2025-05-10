
import React from 'react';

interface ProjectCardProps {
  title: string;
  image: string;
  link: string;
}

const ProjectCard = ({ title, image, link }: ProjectCardProps) => {
  return (
    <div className="card-block-adapt">
      <a href={link} target="_blank" rel="noopener noreferrer">
        <div className="link-block">
          <img className="project-img rounded-t-lg" src={image} alt={title} />
          <p className="card-title py-3">{title}</p>
        </div>
      </a>
    </div>
  );
};

const ProjectsSection = () => {
  const projects = [
    {
      title: "Justice League",
      image: "https://placehold.co/800x500/1B2331/DADADA?text=Justice+League",
      link: "https://yashant.github.io/justiceleague/"
    },
    {
      title: "Let's Make a Deal",
      image: "https://placehold.co/800x500/1B2331/DADADA?text=Let's+Make+a+Deal",
      link: "https://letsmakeadeal.netlify.app/"
    },
    {
      title: "Pixalate",
      image: "https://placehold.co/800x500/1B2331/DADADA?text=Pixalate",
      link: "https://pixalate.netlify.app/"
    },
    {
      title: "Website - HAAi",
      image: "https://placehold.co/800x500/1B2331/DADADA?text=HAAi",
      link: "https://www.humanassisted.ai/"
    },
    {
      title: "Prototype - Arctic Yeti",
      image: "https://placehold.co/800x500/1B2331/DADADA?text=Arctic+Yeti",
      link: "https://www.figma.com/proto/sXgkt14wjIVR6TUPyRskrO/The-Arctic-Yeti?page-id=0%3A1&node-id=1%3A29654&viewport=345%2C257%2C0.04&scaling=scale-down&starting-point-node-id=1%3A29654"
    },
    {
      title: "Prototype - Wheels",
      image: "https://placehold.co/800x500/1B2331/DADADA?text=Wheels",
      link: "https://www.figma.com/proto/o7AMIE11CUEXSGuE1vBxYM/Prototype?page-id=563%3A201&node-id=2072%3A339&viewport=277%2C203%2C0.07&scaling=scale-down&starting-point-node-id=2072%3A339"
    }
  ];

  return (
    <section id="projects" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center">Projects that I enjoyed working on</h2>
        
        <div className="flex-center">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="mb-4">Please hit the damn button. I even gave it a different color here.</p>
          <a 
            href="https://yashantgyawali.typeform.com/to/rbizSifr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cta-button color-cta inline-block mx-auto"
          >
            The colored button
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
