import { Github, Linkedin, Mail } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed w-full bg-[#121212] dark:bg-[#121212] shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-[#ff004f] hover:text-[#ff3399] transition-colors duration-300">
              {"Portfolio"}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[#EAEAEA] hover:text-[#ff004f] dark:hover:text-[#00BFFF] transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/KUNAl4216"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EAEAEA] hover:text-[#ff004f] dark:hover:text-[#00BFFF]"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/kunal-raychandani-76591a19b/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EAEAEA] hover:text-[#ff004f] dark:hover:text-[#00BFFF]"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="raychandanikunal@gmail.com"
                className="text-[#EAEAEA] hover:text-[#ff004f] dark:hover:text-[#00BFFF]"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => {
                console.log("Menu toggled:", !isOpen);
                setIsOpen(!isOpen);
              }}
              className="text-[#EAEAEA]"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#121212] px-4 pt-4 pb-6 shadow-lg transition-all duration-300">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-[#EAEAEA] py-2 px-3 rounded-lg hover:bg-[#ff004f] dark:hover:bg-[#00BFFF] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
