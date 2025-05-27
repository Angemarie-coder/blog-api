import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

// Define Post attributes
interface PostAttributes {
  id: number; 
  title: string;
  body: string;
  authorId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes (id, createdAt, updatedAt are optional)
interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define Post instance type
export interface Post extends Model<PostAttributes, PostCreationAttributes>, PostAttributes {}

// Define Post model
const Post = sequelize.define<Post>(
  'Post',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.INTEGER, 
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Define relationship between Post and User
Post.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

User.hasMany(Post, {
  foreignKey: 'authorId',
  as: 'posts',
});

export default Post;