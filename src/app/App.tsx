import { FunctionComponent } from "react";
import MainLayout from "@layouts/MainLayout";

const App: FunctionComponent = () => {
    return (
		<MainLayout>
			<section>
				{renderBlogPosts()}
				<ButtonLink
					link="/page/2"
					text="Next Page"
					className="button large next"
				/>
			</section>
		</MainLayout>
	)
};

export default App;
