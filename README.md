> *本文不讨论MVVM的历史、优劣和与其他架构模式的对比，有兴趣的可以阅读一下Wikipedia对其描述[Model-view-viewmodel - Wikipedia](https://link.zhihu.com/?target=https%3A//en.wikipedia.org/wiki/Model%25E2%2580%2593view%25E2%2580%2593viewmodel)，和微软对MVVM的解释[The MVVM Pattern](https://link.zhihu.com/?target=https%3A//docs.microsoft.com/en-us/previous-versions/msp-n-p/hh848246%28v%3Dpandp.10%29)。*

网络上对于MVVM架构模式的科普文章已经层出不穷了，这篇文章可能会显得有一些多余。不过本文可能会给你一些不同的思路，说不定会改变你对MVVM的理解和看法。

## **对MVVM架构的拓展解读**

1.  MVVM应该改成M-VM-V会更容易直观地理解。View-Model作为胶水层，把视图View和数据模型Model粘合在一起。
2.  MVVM不是一个纯前端的架构模式。它适用于所有的包含GUI（Graphical User Interface 图形用户接口）的应用程序中（包含后端部分）。
3.  MVVM其实可以细分为M-C-VM-V的四层架构。
4.  对于以上M-C-VM-V层的理解：
    1.  M(odel)层：定义数据结构，建立应用的抽象模型。
    2.  C(ontroller)层：实现业务逻辑，向上暴露数据更新的接口，调用Model层来进行模型数据的增删改查，以达到应用数据更新的目的。
    3.  V(iew)-M(odel)层：将Model层的抽象模型转换为视图模型用于展示，同时将视图交互事件绑定到Controller层的数据更新接口上。
    4.  V(iew)层：将视图模型通过特定的GUI展示出来，并在GUI控件上绑定视图交互事件。
5.  说白了，对于一款拥有GUI的应用程序来说，用户与计算机进行交流的过程，不过是IO（输入输出）的过程。计算机通过输出设备（显示器、扬声器、机械马达等。不过这里我们针对于图形接口来讲的话，一般就是显示器）将视图数据进行展示，用户通过输入设备（键盘、鼠标、触摸板等）来触发特定的事件达到模型的更新。
6.  我们之所以要发明这种分层架构，最主要的原因是为了让Model层和Controller层能够复用。甚至于对于同一款应用程序在不同的GUI上进行展示时，View-Model层也是复用的，仅仅只是把View层进行了替换而已。
7.  再拓展一下，假如我们的应用程序需要在非GUI界面进行实现，而是通过其他UI方式来实现呢？只需要将View-Model层替换成新的UI-Model，再与新的UI进行桥接，同样的功能便可以跨UI进行实现了。
8.  对于上述这点，举个例子：针对于残障人士（比如盲人），我们的应用程序应该更加方便易用。或许我们需要考虑使用扬声器来代替显示器进行输出，同时使用麦克风来进行输入。这时，我们可以将上述的View-Model替换为Audio-Model作为语音模型，UI层即Audio层用于播放语音和接收语音输入。
9.  综上所述，对于UI应用程序（给用户提供了用户接口的应用程序），都可以抽象成M-I-IM（其中I指Interface）架构模式来达到模型、逻辑、表征之间的分离解耦，并提高开发效率。

## **MVVM的最终体现**

根据前面对MVVM的解读，我们可以用下面这张图来描述这种关系：

![](http://upload-images.jianshu.io/upload_images/9330881-f8ed36c150acb50e.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里，我们就浏览器中的Web开发来讲。View层体现为浏览器中的DOM树，View-Model则体现为近几年特别流行的虚拟DOM树，Model则体现为业务逻辑和ORM（Controller被归为Model层）。

以上这张图更加倾向于描述一个基于浏览器的本地应用的架构。我们现在的应用程序更多的是基于网络服务器的，所以把服务器加入到这套架构模式中来，用下图描述一下：

![](http://upload-images.jianshu.io/upload_images/9330881-92782ca58d040dbc.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在上面一张图的基础上，我们添加了Local Logic和Local Store层，分别代表了本地逻辑和数据存储。你会发现，我们通过本地逻辑层和远程逻辑层进行了交互，达到使本地数据存储与远程数据之间的同步。通过这种方式，达到前面一张图描述出来的结构。

既然这样，我们何不对此做一些封装来让图形看起来更加简洁：

![](http://upload-images.jianshu.io/upload_images/9330881-d4fdbcf40ff9f876.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

最终，MVVM的架构模式就很明了了。对于纯Web前端项目来讲，Model指的是上图中的Local Model层，而对于包含了服务器的应用程序来讲，Model指的是上图中的Local Model和Remote Model的组合。

## **可能是MVVM的最佳实践**

对于Local Model和Remote Model之间的同步，有很多种方案，比如HTTP、WebSocket等。那么如何去实现View到View-Model，View-Model到Local Model之间的交互呢？

首先明确一点，DOM是由浏览器进行实现并在显示器上进行展示输出的，这一部分的工作我们一般情况下是不需要处理的。它的地位相当于View对象之于Android应用、Storyboard之于iOS应用。不过呢，我们还是需要编写一些代码，比如XML来对其进行描述（HTML是XML的一个子集，一般图形界面都是由XML语言来进行编写的）。

接着Virtual DOM，不得不提现在比较火的React和Vue框架了。这两个框架实质上可以理解为一种，内部实现核心是虚拟DOM的实现和虚拟DOM树之间的比较算法。这里我们就React来做详细描述。

早期的React是包含了View、View-Model、Model于一身的集大成框架，我们通过React.createClass来创建一个类来作为一个组件类，然后在组件的生命周期函数中实现业务逻辑，在对象成员变量中保存本地数据，并将本地数据转换为视图状态state，然后由state渲染出UI界面。

在后来的发展中，React对自身进行了拆分：

*   JSX，是Virtual DOM的语法糖，我们编写的JSX代码实质上是Virtual DOM，并不是DOM。
*   React-dom，主要职责是将Virtual DOM渲染成浏览器中的DOM。
*   React，主要职责是进行Virtual DOM的维护和diff运算。

在新的版本中，React弱化了State和生命周期，建议用Stateless组件（即函数式组件）来进行组件的开发。至此React将视图状态、本地数据和逻辑完全剥离了出去。

我们可以使用其他的方式来进行视图状态、本地数据的维护和逻辑的实现。React的生态达到完全解耦的地步，完美地诠释了MVVM架构的精髓。

夸完了React，我们回到正题上。前述的React和其相关生态实现了View、View-Model和它们之间的交互，那么View-Model到Model如何更好地进行实现呢？

当然，我们仍然可以用React的类组件来进行实现，毕竟它还没有完全弃用Stateful组件。更加优化的一点的是通过诸如Flux、Redux等状态管理方案。

在Redux中，从React组件中剥离出来的状态和逻辑，被统一的进行管理，再通过connect方法与根组件进行连接达到将状态和方法绑定到组件上面的目的。

对于使用React+Redux的方案，我们的架构图可以这样描述（为了方便查看和理解，这里先不考虑服务器部分）：

![](http://upload-images.jianshu.io/upload_images/9330881-812b9d3de3185a88.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

令人愉快的是，大部分的东西React生态都已经帮我们实现了，我们要做的只有两个部分：

1.  使用JSX描述出期望的DOM结构
2.  使用Redux来管理维护Store，并利用Reducer和Action来实现业务逻辑。

## **可能是更佳的实践**

使用过Redux的人可能会发现，编写Reducer和Action的过程其实是很不友好的。当你的项目越来越庞大的时候，你的DOM树会越来越深，如果要更新一个叶子节点的状态，需要逐级地去对Store进行更新。

Redux主要实现了对状态的剥离，同时因此实现了父子节点之间更简单的通信方式。那么如果我们需要找到一个替代方案，我们至少需要实现这两点。

所谓状态，是对视图在不同情况下的表征的一个动态描述（不会更新的表征是不需要状态的）。所以实质上状态只是一组变量的集合，这些变量可能是布尔值、数字或者数据集。

状态本身其实可以认为是和DOM树无关的，正因为这个前提，我们才可以把状态完全剥离出来。只通过一些协议来进行绑定，比如Redux中的connect方法。

想象一下，如果我们的所有状态是一个完全离散的网络，状态之间没有层级结构的话，是不是就可以更方便地去对状态进行维护，状态之间更简单地去进行通信了呢？我们来看一下下图：

![](http://upload-images.jianshu.io/upload_images/9330881-e76cf3d01b845d6e.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

DOM树实际上是一个多叉树，我们创建一个网络，网络上的节点对应上DOM树上每个节点，代表着这个节点的状态。网络上的节点之间可以互相调用，无视DOM树上的节点层级关系。

我们甚至可以做一些更疯狂的事情，比如下图：

![](http://upload-images.jianshu.io/upload_images/9330881-10cfcc86d39b7563.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

我们可以通过多个节点对应一个状态的方式来实现多个节点间的状态共享，通过一个节点对应多个状态的方式来实现状态的修饰组合[装饰器模式 | 菜鸟教程](https://link.zhihu.com/?target=http%3A//www.runoob.com/design-pattern/decorator-pattern.html)。

把状态抽象成一个对象，它包含了视图状态和状态的更新方法。然后将这个对象和需要使用到这个对象代表的状态的节点进行连接，就可以实现我们的目的了。同时，因为我们是通过一个纯对象来实现状态管理的，实际上我们也可以将本地数据模型在这个对象中进行管理。数据模型和状态模型（即视图模型）之间可以直接在内部进行转化。我们可以把状态模型和数据模型统称为Model。那么我们再更新一下上面的架构图：

![](http://upload-images.jianshu.io/upload_images/9330881-d04417dd60ce3e32.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

到这一步，我们发现其实又回到了最初的那张图的模式了。没错，这就是MVVM的最基本的形态也是最终的形态。

那么问题来了。我们如何实现上述的Store对象和View-Model之间的绑定呢？看下下面这张图：

![](http://upload-images.jianshu.io/upload_images/9330881-6a90388a122c9472.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

我们创建一个中间组件Connector，在Connector中维护一个state对象，将View-Model对应的组件包裹在Connector中，将Connector的state作为包裹组件的属性传入进去。当Store中的变量发生变化时，触发Connector组件的setState方法对state进行更新，同时触发render方法达到使包裹组件重新渲染的目的。利用Javascript的Getter/Setter特性可以很容易地实现这一点。

**针对于上述的架构模式，[connect-store](https://link.zhihu.com/?target=https%3A//www.npmjs.com/package/connect-store) 库应运而生。**

我们来使用connect-store，实现一个计数器。

*   首先创建一个类，来描述我们的数据模型。这将是计数器的核心。我们需要一个模型数据来保存计数，同时需要一个increase方法来实现计数更新。

```
class CounterStore {
  // 计数
  count = 0; // 模型数据，同时也是视图数据
  // 计数增加1
  increase() {
    this.count += 1; // 对计数进行更新
  }
}

```

*   创建一个stateless组件，描述一下期望的展示效果。我们需要展示一个文本，同时需要展示一个按钮，点击这个按钮可以令计数加一。connect-store会将increase方法包装成onIncrease事件传递给视图组件。

```
const CounterView = ({ count, onIncrease }) => {
  return (
    <div>
      <span>{count}</span>
      <button onClick={onIncrease}> + </button>
    </div>
  );
};

```

*   使用connect-store绑定它们并使用react-dom渲染到id为root的DOM节点上。

```
import React from 'react';
import { render } from 'react-dom';
import Connector from 'connect-store';

render(
  <Connector
    View={CounterView}
    store={new CounterStore()}
  />,
  document.getElementById('root')
);
```

![初始渲染效果](http://upload-images.jianshu.io/upload_images/9330881-ef09fb4eb5d50da5.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![点击增加按钮2次后的渲染效果](http://upload-images.jianshu.io/upload_images/9330881-a89a880560342290.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## **还有更佳的实践吗？**

**Javascript交流QQ群:348108867 欢迎你的加入！**
