import { AppDataSource } from '../config/database';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { FindManyOptions } from 'typeorm';

export class PostService {
  private postRepository = AppDataSource.getRepository(Post);
  private userRepository = AppDataSource.getRepository(User);

  // Create a new post
  async create(data: { title: string; body: string; authorId: number }): Promise<Post> {
    try {
      const { title, body, authorId } = data;
      console.log(`Creating post: title=${title}, authorId=${authorId}`);

      // Find the user to set as the author
      const author = await this.userRepository.findOneBy({ id: authorId });
      if (!author) {
        throw new Error(`Author with ID ${authorId} not found`);
      }

      const post = this.postRepository.create({
        title,
        body,
        author
      });

      const savedPost = await this.postRepository.save(post);
      console.log(`Post created: ID=${savedPost.id}`);
      return savedPost;
    } catch (error) {
      console.error('Error in PostService.create:', error);
      throw error; // Propagate to asyncHandler
    }
  }

  // Find all posts with pagination and optional author relation
  async findAll(options: {
    page: number;
    limit: number;
    include?: { model: string; as: string; attributes: string[] }[];
  }): Promise<{ data: Post[]; count: number; totalPages: number }> {
    try {
      const { page, limit, include } = options;
      const skip = (page - 1) * limit;
      console.log(`Fetching posts: page=${page}, limit=${limit}`);

      const findOptions: FindManyOptions<Post> = {
        skip,
        take: limit,
        relations: include?.reduce((acc, item) => ({ ...acc, [item.as]: true }), {}),
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true, // Added to match Post model
          updatedAt: true, // Added to match Post model
          author: include?.[0]?.attributes.reduce((acc, attr) => ({ ...acc, [attr]: true }), {})
        }
      };

      const [data, count] = await this.postRepository.findAndCount(findOptions);
      const totalPages = Math.ceil(count / limit);
      console.log(`Fetched ${data.length} posts, total count=${count}`);

      return { data, count, totalPages };
    } catch (error) {
      console.error('Error in PostService.findAll:', error);
      throw error;
    }
  }

  // Find a single post by ID
  async findById(id: number, options?: {
    include?: { model: string; as: string; attributes: string[] }[];
  }): Promise<Post | null> {
    try {
      console.log(`Fetching post: ID=${id}`);

      const findOptions: FindManyOptions<Post> = {
        where: { id },
        relations: options?.include?.reduce((acc, item) => ({ ...acc, [item.as]: true }), {}),
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true, 
          updatedAt: true,
          author: options?.include?.[0]?.attributes.reduce((acc, attr) => ({ ...acc, [attr]: true }), {})
        }
      };

      const post = await this.postRepository.findOne(findOptions);
      console.log(`Post ${post ? 'found' : 'not found'}: ID=${id}`);
      return post;
    } catch (error) {
      console.error('Error in PostService.findById:', error);
      throw error;
    }
  }

  // Find posts by title (partial match)
  async findByTitle(title: string): Promise<Post[]> {
    try {
      console.log(`Searching posts by title: ${title}`);

      const posts = await this.postRepository
        .createQueryBuilder('post')
        .where('LOWER(post.title) LIKE LOWER(:title)', { title: `%${title}%` })
        .getMany();
      console.log(`Found ${posts.length} posts matching title`);

      return posts;
    } catch (error) {
      console.error('Error in PostService.findByTitle:', error);
      throw error;
    }
  }

  // Update a post
  async update(id: number, updatedData: Partial<{ title: string; body: string }>): Promise<Post | null> {
    try {
      console.log(`Updating post: ID=${id}, data=`, updatedData);

      const post = await this.postRepository.findOneBy({ id });
      if (!post) {
        console.log(`Post not found: ID=${id}`);
        return null;
      }

      Object.assign(post, updatedData);
      const updatedPost = await this.postRepository.save(post);
      console.log(`Post updated: ID=${id}`);

      return updatedPost;
    } catch (error) {
      console.error('Error in PostService.update:', error);
      throw error;
    }
  }

  // Delete a post
  async delete(id: number): Promise<boolean> {
    try {
      console.log(`Deleting post: ID=${id}`);

      const result = await this.postRepository.delete(id);
      const success = result.affected ? result.affected > 0 : false;
      console.log(`Post deletion ${success ? 'successful' : 'failed'}: ID=${id}`);

      return success;
    } catch (error) {
      console.error('Error in PostService.delete:', error);
      throw error;
    }
  }
}