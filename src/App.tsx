import React, { useState } from 'react';
import Navigation from './components/Navigation';
import ThemeToggle from './components/ThemeToggle';
import { Download, Github, Linkedin, Mail, Code, Layout, Cpu, Phone } from 'lucide-react';

const projects = [
  {
    title: 'RaspberryPi_U-Boot_TFTP_Guide',
    description: 'Guide for compiling and loading the Linux kernel and U-Boot on Raspberry Pi using TFTP.',
    githubUrl: 'https://github.com/KUNAl4216/raspberry_u-boot_document',
    icon: <Layout className="w-8 h-8" />,
    tags: ['Document', 'Raspberry Pi', 'U-Boot'],
  },
  {
    title: ' ESP32 AI Voice Assistant',
    description: 'ESP32-based AI voice assistant with real-time speech-to-text and text-to-speech using Deepgram and ChatGPT APIs.',
    githubUrl: 'https://github.com/users/KUNAl4216/projects/3',
    icon: <Code className="w-8 h-8" />,
    tags: [ 'C', ],
  },
  {
    title: 'Kernel_to_userspace_communication',
    description: 'Guide on communication between the Linux kernel and user space, covering system calls, drivers, and IPC mechanisms.',
    githubUrl: 'https://github.com/KUNAl4216/Kernel_to_userspace',
    icon: <Cpu className="w-8 h-8" />,
    tags: ['C', 'Linux'],
  },
  {
    title: 'Linux_USB_Driver',
    description: 'on developing and interfacing USB drivers in the Linux kernel.',
    githubUrl: 'https://github.com/KUNAl4216/Linux_USB_Driver',
    icon: <Code className="w-8 h-8" />,
    tags: ['C', 'Linux'],
  },
];

const skills = [
 // { name: 'HTML', level: 80 },
  //{ name: 'CSS', level: 70 },
  //{ name: 'JavaScript', level: 70 },
  { name: 'Python', level: 80 },
  { name: 'C', level: 83 },
  { name: 'C++', level: 50 },
  //{ name: 'SQL', level: 80 },
 // { name: 'Java', level: 50 },
  //{ name: 'Communication', level: 80 },
 // { name: 'Leadership', level: 80 },
];

const experiences = [
  {
    company: 'NXON AI PRIVATE LIMITED',
    role: 'Intern',
    date: 'Nov 2024 - Mar 2025',
    description: 'Experience in Embedded Systems and Linux Development as an intern at NXON AI PRIVATE LIMITED.',
  },
  {
    company: 'Vector India',
    role: 'Intern',
    date: 'Mar 2025 - Sept 2025',
    description: 'Completed professional training in Embedded Systems at Vector India.',
  },
  
];

function App() {
  const [activeTab, setActiveTab] = useState('skills');
  

  return (
    <div className="min-h-screen bg-[#121212] dark:bg-[#121212] text-[#EAEAEA] dark:text-[#EAEAEA]">
      <ThemeToggle />
      <Navigation />

      {/* Hero Section */}
      <section id="home" className="pt-20 pb-10 bg-gradient-to-b from-[#121212] to-[#121212] dark:from-[#121212] dark:to-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="text-[#ff004f] dark:text-[#00BFFF]">Kunal Raychandani</span>
              </h1>
              <div className="flex space-x-4">
                <a
                  href="src/updateCV.pdf"
                  className="inline-flex items-center px-6 py-3 bg-[#ff004f] text-[#EAEAEA] rounded-lg hover:bg-[#282828] transition-colors"
                  download
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Resume
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center px-6 py-3 border-2 border-[#282828] text-[#EAEAEA] rounded-lg hover:bg-[#282828] hover:text-[#00BFFF] transition-colors"
                >
                  Contact Me
                </a>
              </div>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
            <img
                src="src/newm.jpg"
                alt="Profile"
                className="rounded-full w-64 h-64 object-cover mx-auto shadow-xl border-4 border-[#ff004f]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-[#121212] dark:bg-[#282828]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">About Me</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-[#EAEAEA] dark:text-gray-300 mb-6">
              Hello! I'm Kunal, an Electronics and Communication (EC) engineering student passionate about Embedded Systems, C programming, and Linux Kernel Development. I love working with low-level hardware, optimizing performance, and building efficient, real-time applications. In addition, I have experience with Python and web development, allowing me to create innovative solutions that bridge hardware and software. Constantly learning and experimenting, I strive to push the boundaries of technology.
              </p>
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'skills'
                      ? 'bg-[#282828] text-[#EAEAEA]'
                      : 'text-[#EAEAEA] dark:text-gray-300 hover:text-[#ff004f] dark:hover:text-[#00BFFF]'
                  }`}
                >
                  Skills
                </button>
                <button
                  onClick={() => setActiveTab('experience')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'experience'
                      ? 'bg-[#282828] text-[#EAEAEA]'
                      : 'text-[#EAEAEA] dark:text-gray-300 hover:text-[#ff004f] dark:hover:text-[#00BFFF]'
                  }`}
                >
                  Experience
                </button>
                <button
                  onClick={() => setActiveTab('education')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'education'
                      ? 'bg-[#282828] text-[#EAEAEA]'
                      : 'text-[#EAEAEA] dark:text-gray-300 hover:text-[#ff004f] dark:hover:text-[#00BFFF]'
                  }`}
                >
                  Education
                </button>
              </div>
            </div>
            <div className="bg-[#282828] dark:bg-[#282828] p-6 rounded-lg">
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between mb-1">
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                      <div className="w-full bg-[#282828] dark:bg-[#121212] rounded-full h-2">
                        <div
                          className="bg-[#ff004f] h-2 rounded-full"
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'experience' && (
                <div className="space-y-6">
                  {experiences.map((exp) => (
                    <div key={exp.company} className="border-l-2 border-[#ff004f] pl-4">
                      <h3 className="font-semibold text-lg">{exp.company}</h3>
                      <p className="text-sm text-[#EAEAEA] dark:text-gray-400">{exp.role} | {exp.date}</p>
                      <p className="mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'education' && (
                <div className="space-y-6">
                  <div className="border-l-2 border-[#ff004f] pl-4">
                    <h3 className="font-semibold">Bachelor of Engineering</h3>
                    <p className="text-[#EAEAEA] dark:text-gray-400">LJ University | 2022 - 2025 (Electronics and Communication)</p>
                  </div>
                  <div className="border-l-2 border-[#ff004f] pl-4">
                    <h3 className="font-semibold">Diploma Engineering</h3>
                    <p className="text-[#EAEAEA] dark:text-gray-400">LJ Polytechnic  | 2019 - 2022 (Electronics and Communication) </p>
                  </div>
                  <div className="border-l-2 border-[#ff004f] pl-4">
                    <h3 className="font-semibold">10th Standard</h3>
                    <p className="text-[#EAEAEA] dark:text-gray-400">2019</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-[#121212] dark:bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-[#EAEAEA]">Featured Projects</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div
                key={project.title}
                className="bg-[#282828] dark:bg-[#282828] rounded-lg p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-[#ff004f] dark:bg-[#00BFFF] rounded-lg">
                    {project.icon}
                  </div>
                  <h3 className="text-xl font-semibold ml-4 text-[#EAEAEA]">{project.title}</h3>
                </div>
                <p className="text-[#EAEAEA] dark:text-gray-300 mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#ff004f] dark:bg-[#00BFFF] text-[#EAEAEA] dark:text-[#EAEAEA] rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[#ff004f] dark:text-[#00BFFF] hover:underline"
                >
                  <Github className="w-4 h-4 mr-2" />
                  View on GitHub
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-[#121212] dark:bg-[#282828]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#EAEAEA] mb-12">Contact Me</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-[#EAEAEA] dark:text-gray-300 mb-6">
                Feel free to reach out if you have any questions, opportunities, or just want to chat.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-[#EAEAEA] dark:text-gray-300">
                  <Phone className="w-6 h-6 mr-4" />
                  <span>+91 9510590609</span>
                </div>
                <div className="flex items-center text-[#EAEAEA] dark:text-gray-300">
                  <Mail className="w-6 h-6 mr-4" />
                  <span>raychandanikunal@gmail.com</span>
                </div>
                <div className="flex items-center text-[#EAEAEA] dark:text-gray-300">
                  <Linkedin className="w-6 h-6 mr-4" />
                  <span>https://www.linkedin.com/in/kunal-raychandani-76591a19b/</span>
                </div>
              </div>
            </div>
            <div>
              
              <form action="#" method="POST" className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-[#EAEAEA] dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="w-full bg-[#282828] dark:bg-[#282828] text-[#EAEAEA] dark:text-[#EAEAEA] border border-[#282828] dark:border-[#EAEAEA] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff004f] dark:focus:ring-[#00BFFF]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-[#EAEAEA] dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="w-full bg-[#282828] dark:bg-[#282828] text-[#EAEAEA] dark:text-[#EAEAEA] border border-[#282828] dark:border-[#EAEAEA] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff004f] dark:focus:ring-[#00BFFF]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm text-[#EAEAEA] dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows="4"
                    className="w-full bg-[#282828] dark:bg-[#282828] text-[#EAEAEA] dark:text-[#EAEAEA] border border-[#282828] dark:border-[#EAEAEA] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff004f] dark:focus:ring-[#00BFFF]"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#ff004f] text-[#EAEAEA] rounded-lg hover:bg-[#00BFFF] transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
       {/* Footer Section */}
       <footer className="bg-[#121212] dark:bg-[#282828] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#EAEAEA] dark:text-gray-300">
            &copy; 2025 Kunal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    
  );
}

export default App;
