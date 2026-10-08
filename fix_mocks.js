const fs = require('fs');
const path = require('path');

const mockContentfulMetadata = `
          concepts: [],
          tags: [
            {
              name: faker.lorem.word(),
              id: faker.datatype.uuid(),
            },
          ],
`;

const mockSys = `
          environmentId: 'master',
          firstPublishedAt: faker.date.past().toISOString(),
          id: faker.datatype.uuid(),
          locale: 'en-US',
          publishedAt: faker.date.past().toISOString(),
          publishedVersion: 1,
          spaceId: 'space-123',
`;

const mockAssetFragment = (name) => `
        ${name}: {
          contentfulMetadata: {
            ${mockContentfulMetadata.trim()}
          },
          contentType: 'image/jpeg',
          description: faker.lorem.sentence(),
          fileName: 'image.jpg',
          height: 100,
          size: 1000,
          sys: {
            ${mockSys.trim()}
          },
          title: faker.lorem.word(),
          url: faker.image.imageUrl(),
          width: 100,
        },
`;

const mockPersonFragment = `
              bio: { json: {} },
              company: faker.company.companyName(),
              contentfulMetadata: {
                ${mockContentfulMetadata.trim()}
              },
              image: {
                contentfulMetadata: {
                  ${mockContentfulMetadata.trim()}
                },
                contentType: 'image/jpeg',
                description: '',
                fileName: 'author.jpg',
                height: 100,
                size: 1000,
                sys: {
                  ${mockSys.trim()}
                },
                title: 'Author',
                url: faker.image.imageUrl(),
                width: 100,
              },
              name: faker.name.findName(),
              shortBio: faker.lorem.sentence(),
              sys: {
                ${mockSys.trim()}
              },
              linkedFrom: {
                entryCollection: { total: 0 }
              },
              tagline: '',
              title: '',
              role: '',
              phone: '',
              linkedIn: '',
              medium: '',
              twitter: '',
              email: '',
              facebook: '',
              github: '',
              instagram: '',
`;

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace heroImage and thumbnail with full AssetFragment
  content = content.replace(/heroImage:\s*\{\s*title:[^\}]+,\s*url:[^\}]+\s*\},\s*/g, mockAssetFragment('heroImage').trim() + '\n        ');
  content = content.replace(/thumbnail:\s*\{\s*title:[^\}]+,\s*url:[^\}]+\s*\},\s*/g, mockAssetFragment('thumbnail').trim() + '\n        ');

  // Replace sys with full SysFragment
  content = content.replace(/sys:\s*\{\s*id:\s*faker\.datatype\.uuid\(\),?\s*\},\s*contentfulMetadata/g, `sys: {\n            ${mockSys.trim()}\n          },\n          contentfulMetadata`);

  fs.writeFileSync(filePath, content);
};

const files = [
  'src/features/Posts/Posts.spec.tsx',
  'src/features/MiniPosts/MiniPosts.spec.tsx',
];

files.forEach(processFile);
