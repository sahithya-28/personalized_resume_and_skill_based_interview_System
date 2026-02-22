import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Contact Us</h1>
        <p className="text-gray-600 text-center mb-12">Have questions? We'd love to hear from you</p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600 text-sm">support@sris.com</p>
            <p className="text-gray-600 text-sm">info@sris.com</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600 text-sm">+91  123-4567</p>
            <p className="text-gray-600 text-sm">Mon-Fri 9AM-6PM IST</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Office</h3>
            <p className="text-gray-600 text-sm">Kukatpally</p>
            <p className="text-gray-600 text-sm">Hyderabad-500072</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Send Us a Message</h2>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="How can we help?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" rows={6} placeholder="Tell us more about your inquiry..."></textarea>
            </div>

            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
