/* eslint-disable */
import { useRouter } from 'next/router';
import { HomeWrapper } from '@modules/home/styles';
import { HomeProps } from '@modules/home/types';

export default function Home({ className }: HomeProps) {
  const { query } = useRouter();
  return (
    <HomeWrapper className={className}>
      <span
        dangerouslySetInnerHTML={{
          __html: `queries: ${JSON.stringify(query, null, 2)}`.replace(
            /\n/g,
            '<br>',
          ),
        }}
      />
      <img
        src={query?.src as string}
        alt=""
        style={{
          display: 'block',
          margin: '3rem',
          height: 200,
          width: 200,
          objectFit: 'contain',
        }}
      />
    </HomeWrapper>
  );
}
