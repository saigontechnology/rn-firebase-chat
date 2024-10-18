import { Image } from 'react-native';
import { PreviewData, PreviewDataImage, Size } from './type';

export const getActualImageUrl = (baseUrl: string, imageUrl?: string) => {
  let actualImageUrl = imageUrl?.trim();
  if (!actualImageUrl || actualImageUrl.startsWith('data')) return;

  if (actualImageUrl.startsWith('//'))
    actualImageUrl = `https:${actualImageUrl}`;

  if (!actualImageUrl.startsWith('http')) {
    if (baseUrl.endsWith('/') && actualImageUrl.startsWith('/')) {
      actualImageUrl = `${baseUrl.slice(0, -1)}${actualImageUrl}`;
    } else if (!baseUrl.endsWith('/') && !actualImageUrl.startsWith('/')) {
      actualImageUrl = `${baseUrl}/${actualImageUrl}`;
    } else {
      actualImageUrl = `${baseUrl}${actualImageUrl}`;
    }
  }

  return actualImageUrl;
};

export const getHtmlEntitiesDecodedText = (text?: string) => {
  const actualText = text?.trim();
  if (!actualText) return;

  // Define a mapping of common HTML entities to their corresponding characters
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    // Add more entities as needed
  };

  // Replace the HTML entities in the text with their corresponding characters
  return actualText.replace(
    /&[a-zA-Z0-9#]+;/g,
    (entity) => htmlEntities[entity] || entity
  );
};

export const getContent = (left: string, right: string, type: string) => {
  const contents = {
    [left.trim()]: right,
    [right.trim()]: left,
  };

  return contents[type]?.trim();
};

export const getImageSize = (url: string) => {
  return new Promise<Size>((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => {
        resolve({ height, width });
      },
      // type-coverage:ignore-next-line
      (error) => reject(error)
    );
  });
};

// Functions below use functions from the same file and mocks are not working
/* istanbul ignore next */
export const getPreviewData = async (text: string, requestTimeout = 5000) => {
  const previewData: PreviewData = {
    description: undefined,
    image: undefined,
    link: undefined,
    title: undefined,
  };

  try {
    const textWithoutEmails = text.replace(REGEX_EMAIL, '').trim();

    if (!textWithoutEmails) return previewData;

    const link = textWithoutEmails.match(REGEX_LINK)?.[0];

    if (!link) return previewData;

    let url = link;

    if (!url.toLowerCase().startsWith('http')) {
      url = 'https://' + url;
    }

    let abortControllerTimeout: NodeJS.Timeout;
    const abortController = new AbortController();

    const request = fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
      },
      signal: abortController.signal,
    });

    abortControllerTimeout = setTimeout(() => {
      abortController.abort();
    }, requestTimeout);

    const response = await request;

    clearTimeout(abortControllerTimeout);

    previewData.link = url;

    const contentType = response.headers.get('content-type') ?? '';

    if (REGEX_IMAGE_CONTENT_TYPE.test(contentType)) {
      const image = await getPreviewDataImage(url);
      previewData.image = image;
      return previewData;
    }

    const html = await response.text();

    // Some pages return undefined
    if (!html) return previewData;

    const head = html.substring(0, html.indexOf('<body'));

    // Get page title
    const title = REGEX_TITLE.exec(head);
    previewData.title = getHtmlEntitiesDecodedText(title?.[1]);

    let matches: RegExpMatchArray | null;
    const meta: RegExpMatchArray[] = [];
    while ((matches = REGEX_META.exec(head)) !== null) {
      meta.push(matches);
    }

    const metaPreviewData = meta.reduce<{
      description?: string;
      imageUrl?: string;
      title?: string;
    }>(
      (acc, curr) => {
        if (!curr[2] || !curr[3]) return acc;

        const description =
          !acc.description &&
          (getContent(curr[2], curr[3], 'og:description') ||
            getContent(curr[2], curr[3], 'description'));
        const ogImage =
          !acc.imageUrl && getContent(curr[2], curr[3], 'og:image');
        const ogTitle = !acc.title && getContent(curr[2], curr[3], 'og:title');

        return {
          description: description
            ? getHtmlEntitiesDecodedText(description)
            : acc.description,
          imageUrl: ogImage ? getActualImageUrl(url, ogImage) : acc.imageUrl,
          title: ogTitle ? getHtmlEntitiesDecodedText(ogTitle) : acc.title,
        };
      },
      { title: previewData.title }
    );

    previewData.description = metaPreviewData.description;
    previewData.image = await getPreviewDataImage(metaPreviewData.imageUrl);
    previewData.title = metaPreviewData.title;

    if (!previewData.image) {
      let imageMatches: RegExpMatchArray | null;
      const tags: RegExpMatchArray[] = [];
      while ((imageMatches = REGEX_IMAGE_TAG.exec(html)) !== null) {
        tags.push(imageMatches as RegExpMatchArray);
      }

      let images: PreviewDataImage[] = [];

      for (const tag of tags
        .filter((t) => t[1] && !t[1].startsWith('data'))
        .slice(0, 5)) {
        const image = await getPreviewDataImage(getActualImageUrl(url, tag[1]));

        if (!image) continue;

        images = [...images, image];
      }

      previewData.image = images.sort(
        (a, b) => b.height * b.width - a.height * a.width
      )[0];
    }

    return previewData;
  } catch {
    return previewData;
  }
};

export const getPreviewDataImage = async (
  url?: string
): Promise<PreviewDataImage | undefined> => {
  if (!url) return;

  try {
    const { height, width } = await getImageSize(url);
    const aspectRatio = width / (height || 1);

    const isValidImage =
      height > 100 && width > 100 && aspectRatio > 0.1 && aspectRatio < 10;

    if (isValidImage) {
      return { height, url, width };
    }
  } catch (error) {
    console.error('Error fetching image size:', error);
  }

  return undefined;
};

export const REGEX_EMAIL =
  /([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
export const REGEX_IMAGE_CONTENT_TYPE = /image\/*/g;
// Consider empty line after img tag and take only the src field, space before to not match data-src for example
export const REGEX_IMAGE_TAG = /<img[\n\r]*.*? src=["'](.*?)["']/g;
export const REGEX_LINK =
  /((http|ftp|https):\/\/)?([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i;
// Some pages write content before the name/property, some use single quotes instead of double
export const REGEX_META =
  /<meta.*?(property|name)=["'](.*?)["'].*?content=["'](.*?)["'].*?>/g;
export const REGEX_TITLE = /<title.*?>(.*?)<\/title>/g;
