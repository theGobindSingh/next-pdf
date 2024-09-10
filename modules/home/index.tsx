import { HomeWrapper } from '@modules/home/styles';
import { HomeProps } from '@modules/home/types';
import { useRouter } from 'next/router';

export default function Home({ className }: HomeProps) {
  const { query } = useRouter();
  return (
    <HomeWrapper className={className}>
      <span
        dangerouslySetInnerHTML={{
          __html: `queries: ${JSON.stringify(query, null, 2)}`.replace(
            /\n/g,
            '<br>'
          ),
        }}
      />
    </HomeWrapper>
  );
}
