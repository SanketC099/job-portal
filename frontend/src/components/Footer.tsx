// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Student Job &amp; Internship Portal. All rights reserved.
      </div>
    </footer>
  );
}
