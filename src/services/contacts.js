import { Contact } from '../models/contact.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/index.js';

export const getAllContacts = async ({
  userId,
  page,
  perPage,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filter = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = Contact.find({ userId });

  if (filter.type) {
    contactsQuery.where('contactType').equals(filter.type);
  }

  if (typeof filter.isFavourite === 'boolean') {
    contactsQuery.where('isFavourite').equals(filter.isFavourite);
  }

  const [contactsCount, contacts] = await Promise.all([
    Contact.find().merge(contactsQuery).countDocuments(),
    contactsQuery
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .exec(),
  ]);

  const paginationData = calculatePaginationData(contactsCount, perPage, page);

  return {
    data: contacts,
    ...paginationData,
  };
};

export async function getContactById(contactId, userId) {
  const contactById = await Contact.findById({ _id: contactId, userId }).lean();
  return contactById;
}

export async function createContact(payload) {
  const newContact = await Contact.create(payload);
  return newContact;
}

export async function updateContact(contactId, userId, payload) {
  const result = await Contact.findByIdAndUpdate(
    { _id: contactId, userId },
    payload,
    {
      new: true,
      upsert: true,
      includeResultMetadata: true,
    },
  );

  return {
    value: result.value,
    updatedExisting: result.lastErrorObject.updatedExisting,
  };
}

export async function deleteContact(contactId, userId) {
  const contact = await Contact.findOneAndDelete({ _id: contactId, userId });
  return contact;
}
