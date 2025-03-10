import React, { useState } from 'react';
import { CheckCircle, MapPin, Wifi, Clock, Image, Coffee, Plus } from 'lucide-react';

const AddLocationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    address: '',
    website: '',
    phone: '',
    hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    },
    photos: [],
    
    // Work-Friendliness
    hasWifi: true,
    wifiSpeed: '',
    wifiPassword: '',
    powerOutlets: 'Limited',
    noiseLevel: 'Moderate',
    seatingComfort: 'Good',
    timeRestrictions: 'None',
    purchaseRequirements: 'Every 2 hours',
    
    // Additional Details
    priceRange: '$$',
    dietaryOptions: {
      vegan: false,
      vegetarian: true,
      glutenFree: false
    },
    hasRestrooms: true,
    parkingOptions: 'Street parking',
    specialFeatures: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleNestedChange = (category, key, value) => {
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [key]: value
      }
    });
  };
  
  const nextStep = () => {
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit data to backend API
    console.log('Submitting:', formData);
    // Reset form or show success message
    alert('Thank you for submitting a new work-friendly location! Our team will review it shortly.');
    // Reset form
    setStep(1);
    // Here you would typically navigate to a success page or back to the main app
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Add a Work-Friendly Cafe</h2>
      
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            <MapPin size={20} />
          </div>
          <span className="text-sm mt-1">Basic Info</span>
        </div>
        <div className="flex-1 flex items-center">
          <div className={`h-1 w-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        </div>
        <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            <Wifi size={20} />
          </div>
          <span className="text-sm mt-1">Work Features</span>
        </div>
        <div className="flex-1 flex items-center">
          <div className={`h-1 w-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        </div>
        <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            <Coffee size={20} />
          </div>
          <span className="text-sm mt-1">Details</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cafe Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                placeholder="e.g. Coffee & Bytes"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                placeholder="123 Main St, City, Country"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="+1 (123) 456-7890"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
              <div className="border border-gray-300 rounded-md p-4 space-y-2">
                {Object.entries(formData.hours).map(([day, hours]) => (
                  <div key={day} className="grid grid-cols-6 gap-2 items-center">
                    <div className="col-span-2 capitalize">{day}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleNestedChange('hours', day, {...hours, open: e.target.value})}
                        className="w-full p-1 border border-gray-300 rounded-md"
                        disabled={hours.closed}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleNestedChange('hours', day, {...hours, close: e.target.value})}
                        className="w-full p-1 border border-gray-300 rounded-md"
                        disabled={hours.closed}
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => handleNestedChange('hours', day, {...hours, closed: e.target.checked})}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm">Closed</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Image size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">Upload photos of the cafe (max 10)</p>
                <button type="button" className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md inline-flex items-center">
                  <Plus size={16} className="mr-1" />
                  Add Photos
                </button>
                <p className="text-xs text-gray-400 mt-2">We recommend including the seating area, power outlets, and overall ambiance</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next: Work Features
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Work-Friendliness */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasWifi"
                  checked={formData.hasWifi}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">WiFi Available</span>
              </label>
            </div>
            
            {formData.hasWifi && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Speed</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      name="wifiSpeed"
                      value={formData.wifiSpeed}
                      onChange={handleChange}
                      className="w-32 p-2 border border-gray-300 rounded-md"
                      placeholder="e.g. 50"
                    />
                    <span className="ml-2">Mbps</span>
                    <button type="button" className="ml-4 px-3 py-1 bg-green-100 text-green-600 text-sm rounded-md">
                      Test Now
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Password (Optional)</label>
                  <input
                    type="text"
                    name="wifiPassword"
                    value={formData.wifiPassword}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Leave blank if no password or unknown"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Power Outlet Availability</label>
              <select
                name="powerOutlets"
                value={formData.powerOutlets}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="None">None</option>
                <option value="Very Limited">Very Limited</option>
                <option value="Limited">Limited</option>
                <option value="Abundant">Abundant</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typical Noise Level</label>
              <select
                name="noiseLevel"
                value={formData.noiseLevel}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Very Quiet">Very Quiet</option>
                <option value="Quiet">Quiet</option>
                <option value="Moderate">Moderate</option>
                <option value="Loud">Loud</option>
                <option value="Very Loud">Very Loud</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seating Comfort</label>
              <select
                name="seatingComfort"
                value={formData.seatingComfort}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Poor">Poor</option>
                <option value="Fair">Fair</option>
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Restrictions</label>
              <select
                name="timeRestrictions"
                value={formData.timeRestrictions}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="None">None</option>
                <option value="1 hour">1 hour limit</option>
                <option value="2 hours">2 hour limit</option>
                <option value="4 hours">4 hour limit</option>
                <option value="Other">Other (please specify)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Requirements</label>
              <select
                name="purchaseRequirements"
                value={formData.purchaseRequirements}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="None">None</option>
                <option value="One-time">One-time purchase required</option>
                <option value="Every hour">Purchase required every hour</option>
                <option value="Every 2 hours">Purchase required every 2 hours</option>
                <option value="Other">Other (please specify)</option>
              </select>
            </div>
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next: Additional Details
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                name="priceRange"
                value={formData.priceRange}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="$">$ (Inexpensive)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Expensive)</option>
                <option value="$$$$">$$$$ (Very Expensive)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Options</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dietaryOptions.vegan}
                    onChange={(e) => handleNestedChange('dietaryOptions', 'vegan', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Vegan options</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dietaryOptions.vegetarian}
                    onChange={(e) => handleNestedChange('dietaryOptions', 'vegetarian', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Vegetarian options</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dietaryOptions.glutenFree}
                    onChange={(e) => handleNestedChange('dietaryOptions', 'glutenFree', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Gluten-free options</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasRestrooms"
                  checked={formData.hasRestrooms}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Restrooms Available</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parking Options</label>
              <select
                name="parkingOptions"
                value={formData.parkingOptions}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="None">No parking available</option>
                <option value="Street parking">Street parking</option>
                <option value="Paid parking nearby">Paid parking nearby</option>
                <option value="Free lot">Free parking lot</option>
                <option value="Paid lot">Paid parking lot</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Features (Optional)</label>
              <textarea
                name="specialFeatures"
                value={formData.specialFeatures}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="e.g. Meeting rooms, outdoor seating, quiet areas, etc."
              ></textarea>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  required
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">I confirm that I have visited this location and the information provided is accurate to the best of my knowledge.</span>
              </label>
            </div>
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <CheckCircle size={18} className="mr-2" />
                Submit Location
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddLocationForm;