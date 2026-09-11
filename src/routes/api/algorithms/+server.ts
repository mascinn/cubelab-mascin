import { json } from '@sveltejs/kit';
import algorithms from '$lib/data/algorithms.json';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json({
    success: true,
    count: algorithms.length,
    data: algorithms
  });
};
