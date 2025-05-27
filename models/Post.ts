import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';

interface PostAttributes {
  id: number;
  title: string;
  body: string;
  authorId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id'> {}

export interface Post extends Model<PostAttributes, PostCreationAttributes> {}

const Post = sequelize.define<Post>(
  'Post',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    timestamps: true
  }
);

// Define relationship between Post and User
Post.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(Post, {
  foreignKey: 'authorId',
  as: 'posts'
});

export default Post;