import { Contact } from '../models/contact.js';

export async function getAllContacts() {
  const contacts = await Contact.find().lean();
  return contacts;
}

export async function getContactById(contactId) {
  const contactById = await Contact.findById(contactId).lean();
  return contactById;
}
