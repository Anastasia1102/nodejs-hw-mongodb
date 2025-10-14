import { Contact } from '../models/contact.js';

export async function getAllContacts() {
  const contacts = await Contact.find().lean();
  return contacts;
}

export async function getContactById(contactId) {
  const contactById = await Contact.findById(contactId).lean();
  return contactById;
}

export async function createContact(payload) {
  const newContact = await Contact.create(payload);
  return newContact;
}

export async function updateContact(contactId, payload) {
  const result = await Contact.findByIdAndUpdate(contactId, payload, {
    new: true,
    upsert: true,
    includeResultMetadata: true,
  });

  return {
    value: result.value,
    updatedExisting: result.lastErrorObject.updatedExisting,
  };
}

export async function deleteContact(contactId) {
  const contact = await Contact.findOneAndDelete({ _id: contactId });
  return contact;
}
