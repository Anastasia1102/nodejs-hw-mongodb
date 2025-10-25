import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';

export async function getContactsController(req, res) {
  const userId = req.user._id;

  const { page, perPage } = parsePaginationParams(req.query);

  const { sortBy, sortOrder } = parseSortParams(req.query);

  const filter = parseFilterParams(req.query);

  const contacts = await getAllContacts({
    userId,
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
}

export async function getContactByIdController(req, res) {
  const { contactId } = req.params;

  const userId = req.user._id;

  const contact = await getContactById(contactId, userId);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  return res.status(200).json({
    status: 200,
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
}

export async function createContactController(req, res) {
  const userId = req.user._id;
  const photo = req.file;
  let photoUrl;

  if (photo) {
    photoUrl = await uploadToCloudinary(photo.path);
  }

  const contact = await createContact({ ...req.body, userId, photo: photoUrl });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
}

export async function updateContactByIdController(req, res) {
  const { contactId } = req.params;
  const userId = req.user._id;
  const photo = req.file;
  let photoUrl;

  if (photo) {
    photoUrl = await uploadToCloudinary(photo.path);
  }

  const updated = await updateContact(contactId, userId, {
    ...req.body,
    ...(photoUrl && { photo: photoUrl }),
  });

  if (!updated) throw createHttpError(404, 'Contact not found');

  res.status(200).json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: updated,
  });
}

export async function deleteContactController(req, res) {
  const { contactId } = req.params;
  const userId = req.user._id;
  const deleted = await deleteContact(contactId, userId);
  if (!deleted) throw createHttpError(404, 'Contact not found');

  return res.status(204).end();
}
